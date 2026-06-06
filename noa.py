import os
from langchain_core.messages import AIMessage
import datetime
import json
import pytz
import concurrent.futures
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_ollama.llms import OllamaLLM
from langchain_openai import ChatOpenAI

from utils import (
    TokenBudgetManager,
    generate_birth_chart_markdown,
    trim_astrological_report,
    strip_think_tags,
    extract_json_from_llm_response,
)
from chains import (
    get_chain,
    SITUATION_FRAMING_PROMPT,
    SEASONAL_THEME_PROMPT,
    USER_CARD_PROMPT,
    AGENT_SPANNER_PROMPT,
    GOAL_ARCHITECT_PROMPT,  # NEW
    GOAL_UPDATER_PROMPT,  # NEW
    MEMORY_ARCHITECT_PROMPT,
    SOCIAL_VISOR_PROMPT,
    SEASONAL_FUNNEL_PROMPT,
    CONMUTER_PROMPT,
    STRATEGIST_PROMPT,
    PHILOSOPHICAL_REFRAMER_PROMPT,
    COUNCIL_PROMPT,
    RECOMMENDER_PROMPT,
    INTERROGATOR_PROMPT,
    RECOMMENDATION_USER_PROFILE_PROMPT,
    GROUP_PERCEPTION_PROMPT,
    FORECAST_PROMPT,  # NEW
    RPG_CLASS_PROMPT,  # NEW
    PERSONA_FROM_USER_CARD_PROMPT,
    PERSONA_SYSTEM_PROMPT,
)
from graph import create_agent_graph

from dotenv import load_dotenv

load_dotenv()
gemini_api_key = os.getenv("GEMINI_API_KEY")
openrouter_api_key = os.getenv("OPEN_ROUTER")
longcat_api_key = os.getenv("LONGCAT_API")
longcat_base_url = os.getenv("LONGCAT_URL")


class NOA:
    """
    Manages a persistent network of cognitive agents to simulate social causality.
    The network is created once and can be queried multiple times with new actions.
    """

    def __init__(
        self,
        user_context: dict,
        n_people: int,
        provider: str,
        model: str,
        seasonal_datetime: datetime.datetime = None,
        log_callback=None,
        progress_callback=None,
        token_manager=None,
        pregenerated_personas: list = None,
    ):  # NEW: Added pregenerated_personas
        self.user_context = user_context
        self.n_people = n_people
        self.provider = provider
        self.seasonal_datetime = seasonal_datetime
        self.log_callback = log_callback
        self.progress_callback = progress_callback
        self.pregenerated_personas = pregenerated_personas or []  # NEW

        if token_manager:
            self.token_manager = token_manager
        else:
            self.token_manager = TokenBudgetManager()

        if self.provider == "local":
            self.llm = OllamaLLM(
                model=model, callbacks=[self.token_manager], format="json"
            )
            self.str_llm = OllamaLLM(model=model, callbacks=[self.token_manager])
        elif self.provider == "openrouter":
            openrouter_settings = {
                "api_key": openrouter_api_key,
                "base_url": os.getenv(
                    "OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"
                ),
                "model": model,
                "callbacks": [self.token_manager],
                "max_retries": 6,
                "default_headers": {
                    "HTTP-Referer": os.getenv("YOUR_SITE_URL", ""),
                    "X-Title": os.getenv("YOUR_SITE_NAME", ""),
                },
            }
            self.llm = ChatOpenAI(
                **openrouter_settings,
                model_kwargs={"response_format": {"type": "json_object"}},
            )
            self.str_llm = ChatOpenAI(**openrouter_settings)
        elif self.provider == "longcat":
            longcat_settings = {
                "api_key": longcat_api_key,
                "base_url": longcat_base_url,
                "model": model,
                "callbacks": [self.token_manager],
                "max_retries": 6,
            }
            self.llm = ChatOpenAI(
                **longcat_settings,
                model_kwargs={"response_format": {"type": "json_object"}},
            )
            self.str_llm = ChatOpenAI(**longcat_settings)
        else:  # Default to Google Gemini
            gemini_settings = {
                "model": model,
                "callbacks": [self.token_manager],
                "google_api_key": gemini_api_key,
                "max_retries": 6,
            }
            self.llm = ChatGoogleGenerativeAI(
                **gemini_settings,
                generation_config={"response_mime_type": "application/json"},
            )
            self.str_llm = ChatGoogleGenerativeAI(**gemini_settings)

        self.graph = None
        self.agent_configs = {}
        self.agent_memories = {}
        self.agent_personas = {}
        self.occluded_user_cards = {}
        self.agent_social_cards = {}
        self.last_fragmented_prompts = {}
        self._log("🚀 NOA instance created. Starting network creation...", level="info")
        self._create_network()

    def _log(self, message: str, level: str = "info"):
        """Helper method to send logs to the callback if it exists."""
        print(message)
        if self.log_callback:
            self.log_callback(message, level)

    def _get_response_content(self, raw_response):
        """
        Helper to consistently get content from LLM response,
        handling local (string) vs remote (AIMessage object) differences.
        """
        if self.provider != "local" and hasattr(raw_response, "content"):
            return raw_response.content
        return raw_response

    def _format_goals_for_prompt(self, goals: list, level=0) -> str:
        """Recursively formats hierarchical goals into an indented string for the prompt."""
        if not goals:
            return "- None"

        goal_string = ""
        indent = "    " * level

        for goal_item in goals:
            if isinstance(goal_item, dict):
                goal_string += (
                    f"{indent}- Goal: {goal_item.get('goal', 'Unnamed Goal')}\n"
                )
                if "subgoals" in goal_item and goal_item["subgoals"]:
                    goal_string += self._format_goals_for_prompt(
                        goal_item["subgoals"], level + 1
                    )
        return goal_string

    def _assemble_agent_prompt(self, name: str) -> str:
        """Assembles the final system prompt for a single agent."""
        persona = self.agent_personas.get(name, {})
        if not persona:
            return "Error: Persona not found."

        attributes = persona.get("personality_attributes", {})

        def format_list_for_prompt(items: list) -> str:
            if not items or not isinstance(items, list):
                return "- None"
            return "\n".join([f"- {item}" for item in items])

        # Format memories from self.agent_memories
        memories = self.agent_memories.get(name, [])
        formatted_memories = (
            "\n".join([f"- {memory}" for memory in memories])
            if memories
            else "- No memories yet."
        )

        prompt_data = {
            "name": name,
            "core_identity_purpose": attributes.get(
                "Core Identity & Purpose", "[Not specified]"
            ),
            "emotional_baseline_needs": attributes.get(
                "Emotional Baseline & Needs", "[Not specified]"
            ),
            "communication_thought_process": attributes.get(
                "Communication & Thought Process", "[Not specified]"
            ),
            "values_relationship_style": attributes.get(
                "Values & Relationship Style", "[Not specified]"
            ),
            "approach_action_conflict": attributes.get(
                "Approach to Action & Conflict", "[Not specified]"
            ),
            "attitude_growth_risk": attributes.get(
                "Attitude towards Growth & Risk", "[Not specified]"
            ),
            "sense_responsibility_discipline": attributes.get(
                "Sense of Responsibility & Discipline", "[Not specified]"
            ),
            "reaction_change_unexpected": attributes.get(
                "Reaction to Change & the Unexpected", "[Not specified]"
            ),
            "ideals_dreams_blind_spots": attributes.get(
                "Ideals, Dreams, & Blind Spots", "[Not specified]"
            ),
            "relationship_power_transformation": attributes.get(
                "Relationship with Power & Transformation", "[Not specified]"
            ),
            "core_wound_empathy": attributes.get(
                "Core Wound & Source of Empathy", "[Not specified]"
            ),
            "long_term_ambition_legacy": attributes.get(
                "Long-Term Ambition & Legacy", "[Not specified]"
            ),
            "virtues": format_list_for_prompt(persona.get("virtues", [])),
            "tensions": format_list_for_prompt(persona.get("tensions", [])),
            "skills": format_list_for_prompt(persona.get("skills", [])),
            "fears": format_list_for_prompt(persona.get("fears", [])),
            "goals": self._format_goals_for_prompt(persona.get("goals", [])),
            "memories": formatted_memories,
        }

        partially_filled_prompt = PERSONA_SYSTEM_PROMPT.format(**prompt_data)
        prompt_with_user_card = partially_filled_prompt.replace(
            "{{occluded_user_card}}",
            self.occluded_user_cards.get(name, "No specific vision."),
        )
        social_card_text = "\n".join(
            self.agent_social_cards.get(name, ["You have no contacts."])
        )
        final_prompt = prompt_with_user_card.replace(
            "{{social_cards}}", social_card_text
        )

        return final_prompt

    def _create_network(self):
        """Orchestrates the step-by-step creation of the agent network."""
        try:
            # Step 1: Situation Framing
            self._log("Step 1: Framing the situation...", level="step")
            if self.progress_callback:
                self.progress_callback(0.05, "Framing situation...")
            chain = get_chain(self.llm, SITUATION_FRAMING_PROMPT, "json")
            self.situation_archetype = chain.invoke({"user_context": self.user_context})
            self.situation_archetype = extract_json_from_llm_response(
                self._get_response_content(self.situation_archetype)
            )
            if not self.situation_archetype or not isinstance(
                self.situation_archetype, dict
            ):
                raise ValueError(
                    "Failed to generate Situation Archetype. LLM returned invalid data."
                )
            self._log(
                f"Core Theme Identified: {self.situation_archetype.get('core_theme')}",
                level="detail",
            )

            # Step 2: User Birth Chart
            self._log("Step 2: Generating user birth chart...", level="step")
            if self.progress_callback:
                self.progress_callback(0.1, "Generating user chart...")
            user_bday = datetime.datetime.strptime(
                self.user_context["birth_date"], "%Y-%m-%d"
            )
            chart_md = generate_birth_chart_markdown(
                self.user_context["name"], user_bday, 12, 0, "New York", "USA"
            )
            self.user_birth_chart = trim_astrological_report(chart_md)

            # Step 3: Seasonal Theme
            self._log("Step 3: Determining seasonal theme...", level="step")
            if self.progress_callback:
                self.progress_callback(0.15, "Determining seasonal theme...")
            chain = get_chain(self.str_llm, SEASONAL_THEME_PROMPT)
            now = (
                self.seasonal_datetime
                if self.seasonal_datetime
                else datetime.datetime.now(pytz.timezone("America/New_York"))
            )
            current_chart = trim_astrological_report(
                generate_birth_chart_markdown(
                    "CurrentSeason", now, now.hour, now.minute, "New York", "USA"
                )
            )
            raw_response = chain.invoke({"birth_chart": current_chart})
            self.season = self._get_response_content(raw_response)
            self._log(
                "Seasonal theme determined and will be used to flavor user actions.",
                level="detail",
            )

            # Step 4: User Card
            self._log("Step 4: Creating user profile card...", level="step")
            if self.progress_callback:
                self.progress_callback(0.20, "Creating user profile...")
            chain = get_chain(self.llm, USER_CARD_PROMPT, "json")
            self.user_profile = chain.invoke(
                {
                    "user_context": self.user_context,
                    "birth_chart": self.user_birth_chart,
                }
            )
            self.user_profile = extract_json_from_llm_response(
                self._get_response_content(self.user_profile)
            )
            if not self.user_profile or not isinstance(self.user_profile, dict):
                raise ValueError(
                    "Failed to generate User Profile Card. LLM returned invalid data."
                )
            self._log(
                f"User Profile for {self.user_context['name']} created. Role: {self.user_profile.get('social_role')}",
                level="detail",
            )

            # Step 5: Agent Spanner (MODIFIED to handle pre-generated personas)
            self._log(
                "Step 5: Spanning audience agent personas (base)...", level="step"
            )
            if self.progress_callback:
                self.progress_callback(0.25, "Generating agent personas...")

            # Start with pre-generated personas
            self.agent_personas = {p["name"]: p for p in self.pregenerated_personas}
            for p in self.pregenerated_personas:
                self._log(
                    f"Loaded pre-generated Persona: {p.get('name')}", level="info"
                )

            # Calculate how many more agents to generate
            n_to_generate = self.n_people - len(self.pregenerated_personas)

            if n_to_generate > 0:
                self._log(
                    f"Generating {n_to_generate} additional personas...", level="detail"
                )
                chain = get_chain(self.llm, AGENT_SPANNER_PROMPT, "json")
                content = chain.invoke(
                    {
                        "n_people": n_to_generate,
                        "user_context": self.user_context["story"],
                    }
                )
                content = extract_json_from_llm_response(
                    self._get_response_content(content)
                )
                if not content or "personas" not in content:
                    self._log(
                        f"Agent Spanner returned invalid data: {content}",
                        level="error",
                    )
                    raise ValueError("Agent Spanner returned invalid or empty data.")

                generated_personas_list = content.get("personas", [])
                for p in generated_personas_list:
                    # Merge with existing personas, avoiding name collisions
                    if p["name"] not in self.agent_personas:
                        self.agent_personas[p["name"]] = p
                        self._log(f"Generated Persona: {p.get('name')}", level="detail")
                    else:
                        self._log(
                            f"Warning: Generated persona name '{p['name']}' conflicts with a pre-generated one. Skipping.",
                            level="warning",
                        )

            agent_personas_list = list(self.agent_personas.values())

            # NEW Step 5.2: Goal Architect
            self._log("Step 5.2: Architecting initial agent goals...", level="step")
            goal_chain = get_chain(self.llm, GOAL_ARCHITECT_PROMPT, "json")
            for i, p in enumerate(agent_personas_list):
                if self.progress_callback:
                    self.progress_callback(
                        0.30 + (i / len(agent_personas_list)) * 0.10,
                        f"Generating goals for {p.get('name')}...",
                    )
                goal_input = {
                    "name": p.get("name"),
                    "personality_attributes": json.dumps(
                        p.get("personality_attributes")
                    ),
                    "virtues": json.dumps(p.get("virtues")),
                    "tensions": json.dumps(p.get("tensions")),
                    "skills": json.dumps(p.get("skills")),
                    "fears": json.dumps(p.get("fears")),
                }
                goals_response = goal_chain.invoke(goal_input)
                goals_data = extract_json_from_llm_response(
                    self._get_response_content(goals_response)
                )
                if goals_data and "goals" in goals_data:
                    self.agent_personas[p["name"]]["goals"] = goals_data["goals"]
                else:
                    self.agent_personas[p["name"]]["goals"] = []
                self._log(
                    f"Generated initial goal hierarchy for {p.get('name')}",
                    level="detail",
                )

            # Parallel Step: Memory Architect & Social Visor (User Card)
            self._log(
                "Step 5.5 & 6: Architecting memories and generating user visions in parallel...",
                level="step",
            )
            memory_chain = get_chain(
                self.str_llm, MEMORY_ARCHITECT_PROMPT
            )  # Returns string
            visor_chain = get_chain(
                self.llm, SOCIAL_VISOR_PROMPT, "json"
            )  # Returns dict

            memory_tasks = [
                {
                    "name": p.get("name"),
                    "personality_attributes": json.dumps(
                        p.get("personality_attributes")
                    ),
                    "skills": json.dumps(p.get("skills")),
                    "fears": json.dumps(p.get("fears")),
                    "situation_context": json.dumps(self.situation_archetype),
                }
                for p in self.agent_personas.values()
            ]
            visor_tasks = [
                {
                    "profile_a": p["personality_attributes"],
                    "profile_b": self.user_profile["archetypal_profile"],
                }
                for p in self.agent_personas.values()
            ]
            self.occluded_user_cards = {}

            futures = {}
            with concurrent.futures.ThreadPoolExecutor() as executor:
                for i, task in enumerate(memory_tasks):
                    futures[executor.submit(memory_chain.invoke, task)] = ("memory", i)
                for i, task in enumerate(visor_tasks):
                    futures[executor.submit(visor_chain.invoke, task)] = ("visor", i)

                total_tasks = len(futures)
                completed_tasks = 0
                memory_results = [None] * len(memory_tasks)
                visor_results = [None] * len(visor_tasks)

                for future in concurrent.futures.as_completed(futures):
                    task_type, index = futures[future]
                    try:
                        result = future.result()
                        if task_type == "memory":
                            result = strip_think_tags(
                                self._get_response_content(result)
                            )
                            memory_results[index] = result  # Result is a string
                        else:
                            result = extract_json_from_llm_response(
                                self._get_response_content(result)
                            )
                            visor_results[index] = result  # Result is a dict
                    except Exception as exc:
                        self._log(
                            f"A parallel task generated an exception: {exc}",
                            level="error",
                        )

                    completed_tasks += 1
                    if self.progress_callback:
                        progress = 0.45 + (completed_tasks / total_tasks) * 0.25
                        self.progress_callback(
                            progress,
                            f"Architecting memories & visions ({completed_tasks}/{total_tasks})...",
                        )

            monologues = [
                self._get_response_content(result) if result else ""
                for result in memory_results
            ]

            agent_personas_list_for_iteration = list(self.agent_personas.values())
            for i, persona in enumerate(agent_personas_list_for_iteration):
                persona["initial_memory"] = monologues[i]
                self.agent_memories[persona["name"]] = [persona["initial_memory"]]
                self._log(
                    f'Initial Memory for {persona["name"]}: "{monologues[i][:100]}..."',
                    level="detail",
                )

            for i, persona in enumerate(agent_personas_list_for_iteration):
                vision_obj = visor_results[i]
                vision_statement = "No vision statement was generated."
                if isinstance(vision_obj, dict) and "vision_statement" in vision_obj:
                    vision_statement = vision_obj["vision_statement"]
                self.occluded_user_cards[persona["name"]] = vision_statement
                self._log(
                    f"{persona['name']}'s vision of {self.user_context['name']}: '{vision_statement}'",
                    level="detail",
                )

            # Step 7: Conmuter (Communication Channels)
            self._log("Step 7: Detecting communication channels...", level="step")
            if self.progress_callback:
                self.progress_callback(0.75, "Detecting communication channels...")
            conmuter_chain = get_chain(self.llm, CONMUTER_PROMPT, "json")
            content = conmuter_chain.invoke(
                {"agent_personas": list(self.agent_personas.values())}
            )
            content = extract_json_from_llm_response(
                self._get_response_content(content)
            )
            if not content or "channels" not in content:
                raise ValueError("Conmuter returned invalid or empty data.")
            self.channels = content.get("channels", [])
            for channel in self.channels:
                members = ", ".join(channel.get("members", []))
                self._log(
                    f"Detected Channel: [{members}] - Reason: {channel.get('basis_for_connection')}",
                    level="detail",
                )

            # Step 8: Social Visor (Mutual Agent Cards)
            self._log(
                "Step 8: Generating mutual social cards for agents...", level="step"
            )
            self.agent_social_cards = {name: [] for name in self.agent_personas.keys()}
            mutual_vision_tasks = []
            personas_by_name = self.agent_personas

            for group in self.channels:
                members = group.get("members", [])
                for i in range(len(members)):
                    for j in range(i + 1, len(members)):
                        name_a, name_b = members[i], members[j]
                        if name_a in personas_by_name and name_b in personas_by_name:
                            mutual_vision_tasks.append(
                                {"viewer": name_a, "viewed": name_b}
                            )
                            mutual_vision_tasks.append(
                                {"viewer": name_b, "viewed": name_a}
                            )

            if mutual_vision_tasks:
                tasks_to_run = [
                    {
                        "profile_a": personas_by_name[t["viewer"]][
                            "personality_attributes"
                        ],
                        "profile_b": personas_by_name[t["viewed"]][
                            "personality_attributes"
                        ],
                    }
                    for t in mutual_vision_tasks
                ]

                vision_results = []
                total_vision_tasks = len(tasks_to_run)
                for i, task_data in enumerate(tasks_to_run):
                    result_obj = visor_chain.invoke(task_data)
                    vision_results.append(result_obj)
                    if self.progress_callback:
                        progress = 0.8 + (i + 1) / total_vision_tasks * 0.15
                        self.progress_callback(
                            progress,
                            f"Generating mutual social visions ({i + 1}/{total_vision_tasks})...",
                        )

                for i, task in enumerate(mutual_vision_tasks):
                    viewer, viewed = task["viewer"], task["viewed"]
                    vision_obj = vision_results[i]
                    vision_obj = extract_json_from_llm_response(
                        self._get_response_content(vision_obj)
                    )
                    vision = "Error generating vision."
                    if (
                        isinstance(vision_obj, dict)
                        and "vision_statement" in vision_obj
                    ):
                        vision = vision_obj["vision_statement"]
                    self.agent_social_cards[viewer].append(
                        f"\t{viewed}\n\t\t{vision.strip()}"
                    )
                    self._log(
                        f"Mutual Vision: {viewer} -> {viewed}: '{vision}'",
                        level="detail",
                    )

            # Step 9: Assembling final prompts and creating graph
            self._log(
                "Step 9: Assembling final prompts and creating graph...", level="step"
            )
            if self.progress_callback:
                self.progress_callback(0.98, "Assembling graph...")

            for name in self.agent_personas.keys():
                final_prompt = self._assemble_agent_prompt(name)
                self.agent_configs[name] = {"prompt": final_prompt, "llm": self.llm}

            self.graph = create_agent_graph(self.agent_configs)

            if self.progress_callback:
                self.progress_callback(1.0, "Network complete!")
            self._log("✅ Network creation complete.", level="info")

        except Exception as e:
            self._log(f"❌ FATAL ERROR during network creation: {e}", level="error")
            import traceback

            traceback.print_exc()
            self.graph = None
            if self.progress_callback:
                self.progress_callback(1.0, "Error during creation!")

    def query(self, user_action: str) -> tuple:
        if not self.graph:
            return "Execution halted due to setup error.", {}, {}, {}

        self._log(f"⚡ Processing new action: '{user_action}'", level="step")

        # Step 1 (Query-time): Seasonal Attention Funnel
        self._log(
            "Step 1: Flavorizing user action with seasonal theme...", level="detail"
        )
        funnel_chain = get_chain(self.llm, SEASONAL_FUNNEL_PROMPT, "json")
        attention_result = funnel_chain.invoke(
            {"season": self.season, "user_action": user_action}
        )
        attention_result = extract_json_from_llm_response(
            self._get_response_content(attention_result)
        )

        if not attention_result or "user_action_with_attention" not in attention_result:
            self._log(
                "Warning: Seasonal Funnel failed. Using original user action.",
                level="warning",
            )
            user_action_with_attention = user_action
        else:
            user_action_with_attention = f"""

            {self.user_context.get("name", "User")} action:
                {user_action}

            How the action resonates with overall feel of these days:
                {attention_result["user_action_with_attention"]}

            """
        self._log(f"Themed Action: {user_action_with_attention}", level="detail")

        # NEW Step 2 (Query-time): Update Agent Goals
        self._log("Step 2: Updating agent goals based on new action...", level="detail")
        goal_updater_chain = get_chain(self.llm, GOAL_UPDATER_PROMPT, "json")
        all_agent_names = list(self.agent_configs.keys())

        for name in all_agent_names:
            persona = self.agent_personas[name]
            updater_input = {
                "personality_attributes": json.dumps(
                    persona.get("personality_attributes")
                ),
                "current_goals": json.dumps(persona.get("goals", [])),
                "recent_memory": "\n".join(
                    self.agent_memories.get(name, [])[-3:]
                ),  # Use last 3 memories
                "user_action": user_action_with_attention,
            }
            updated_goals_response = goal_updater_chain.invoke(updater_input)
            updated_goals_data = extract_json_from_llm_response(
                self._get_response_content(updated_goals_response)
            )
            if updated_goals_data and "goals" in updated_goals_data:
                self.agent_personas[name]["goals"] = updated_goals_data["goals"]
        self._log("All agent goals updated.", level="detail")

        user_name = self.user_context.get("name", "User")
        final_action_for_graph = f"{user_name} said: {user_action_with_attention}"

        target_agents = [
            name for name in all_agent_names if name.lower() in user_action.lower()
        ]

        # Step 3 (Query-time): Assemble fresh prompts and query graph
        self._log("Step 3: Querying the agent graph...", level="detail")

        agent_prompts = {
            name: config["prompt"] for name, config in self.agent_configs.items()
        }

        initial_state = {
            "agent_prompts": agent_prompts,
            "agent_llms": {
                name: config["llm"] for name, config in self.agent_configs.items()
            },
            "str_llm": self.str_llm,
            "agent_memories": self.agent_memories,
            "user_action": final_action_for_graph,
            "target_agents": target_agents,
            "turn_messages": [],
            "final_reactions": {},
            "provider": self.provider,
            "fragmented_prompts": {},
        }
        final_state = self.graph.invoke(initial_state)

        # Update memories with the agent's own actions from the turn
        self.agent_memories = final_state["agent_memories"]
        self.last_fragmented_prompts = final_state.get("fragmented_prompts", {})
        self._log(
            "Agent memories have been updated with their own actions.", level="detail"
        )

        # NEW: Process private messages and add them to the recipient's memory for the *next* turn
        self._log("Processing private messages for next turn...", level="detail")
        turn_messages = final_state.get("turn_messages", [])
        if turn_messages:
            for msg in turn_messages:
                recipient = msg.get("to")
                sender = msg.get("from")
                content = msg.get("content")

                if recipient and recipient in self.agent_memories:
                    memory_log = (
                        f"[Private Message Received from {sender}] Content: '{content}'"
                    )
                    self.agent_memories[recipient].append(memory_log)
                    self._log(
                        f"Added message from {sender} to {recipient}'s memory.",
                        level="detail",
                    )
                else:
                    self._log(
                        f"Warning: Could not deliver private message to non-existent agent '{recipient}'.",
                        level="warning",
                    )

        # Step 4 (Query-time): Generate reports
        self._log("Generating strategic report...", level="detail")
        strat_chain = get_chain(self.str_llm, STRATEGIST_PROMPT)
        strat_report = strip_think_tags(
            self._get_response_content(
                strat_chain.invoke(
                    {
                        "user_profile": json.dumps(self.user_profile),
                        "user_action_with_attention": user_action_with_attention,
                        "agent_reactions": json.dumps(final_state["final_reactions"]),
                        "agent_profiles": initial_state[
                            "agent_prompts"
                        ],  # Use the fresh prompts
                    }
                )
            )
        )

        self._log("Generating group perception report...", level="detail")
        perception_chain = get_chain(self.str_llm, GROUP_PERCEPTION_PROMPT)
        perception_report = strip_think_tags(
            self._get_response_content(
                perception_chain.invoke(
                    {
                        "user_profile": json.dumps(self.user_profile),
                        "user_action": user_action_with_attention,
                        "agent_reactions": json.dumps(final_state["final_reactions"]),
                        "agent_profiles": json.dumps(self.agent_personas),
                    }
                )
            )
        )

        report = f"{strat_report}\n\n---\n\n### Group Perception Analysis\n\n{perception_report}"

        self._log("Judging user intention...", level="detail")
        council_chain = get_chain(self.llm, COUNCIL_PROMPT, "json")
        judged_intention = council_chain.invoke({"user_action": user_action})
        judged_intention = extract_json_from_llm_response(
            self._get_response_content(judged_intention)
        )

        self._log("Query complete.", level="info")
        return (
            report,
            judged_intention,
            self.last_fragmented_prompts,
            final_state["final_reactions"],
        )

    @staticmethod
    def recommend(llm, user_birth_date: str) -> list:
        print(f"Generating recommendations for birth date: {user_birth_date}...")
        try:
            temp_bday = datetime.datetime.strptime(user_birth_date, "%Y-%m-%d")
            temp_chart = trim_astrological_report(
                generate_birth_chart_markdown(
                    "temp_user", temp_bday, 12, 0, "New York", "USA"
                )
            )

            profile_chain = get_chain(llm, RECOMMENDATION_USER_PROFILE_PROMPT, "json")
            profile = profile_chain.invoke({"birth_chart": temp_chart})
            if not profile:
                raise ValueError("Failed to generate recommendation profile.")
            profile = extract_json_from_llm_response(
                profile.content if isinstance(profile, AIMessage) else profile
            )

            rec_chain = get_chain(llm, RECOMMENDER_PROMPT, "json")
            recommendations = rec_chain.invoke({"user_profile": json.dumps(profile)})
            if not recommendations:
                raise ValueError("Failed to generate recommendations.")
            recommendations = extract_json_from_llm_response(
                recommendations.content
                if isinstance(recommendations, AIMessage)
                else recommendations
            )

            return recommendations

        except Exception as e:
            print(f"Error in recommend method: {e}")
            raise e

    @staticmethod
    def forecast(llm, str_llm, user_birth_date: str, forecast_date: str) -> str:
        """
        Generates a social engineering forecast report by comparing the user's profile
        with the archetypal profile of a given forecast date.
        """
        print(
            f"Generating forecast for user born {user_birth_date} on date {forecast_date}..."
        )
        try:
            # 1. Generate both profiles
            profile_chain = get_chain(llm, RECOMMENDATION_USER_PROFILE_PROMPT, "json")

            # User Profile
            user_bday = datetime.datetime.strptime(user_birth_date, "%Y-%m-%d")
            user_chart = trim_astrological_report(
                generate_birth_chart_markdown(
                    "user", user_bday, 12, 0, "New York", "USA"
                )
            )
            user_profile_raw = profile_chain.invoke({"birth_chart": user_chart})
            user_profile = extract_json_from_llm_response(
                user_profile_raw.content
                if isinstance(user_profile_raw, AIMessage)
                else user_profile_raw
            )
            if not user_profile:
                raise ValueError("Failed to generate user profile for forecast.")

            # Seasonal (Forecast Date) Profile
            forecast_dt = datetime.datetime.strptime(forecast_date, "%Y-%m-%d")
            seasonal_chart = trim_astrological_report(
                generate_birth_chart_markdown(
                    "season", forecast_dt, 12, 0, "New York", "USA"
                )
            )
            seasonal_profile_raw = profile_chain.invoke({"birth_chart": seasonal_chart})
            seasonal_profile = extract_json_from_llm_response(
                seasonal_profile_raw.content
                if isinstance(seasonal_profile_raw, AIMessage)
                else seasonal_profile_raw
            )
            if not seasonal_profile:
                raise ValueError("Failed to generate seasonal profile for forecast.")

            # 2. Generate the forecast report
            forecast_chain = get_chain(
                str_llm, FORECAST_PROMPT
            )  # Expects a string report
            report_raw = forecast_chain.invoke(
                {
                    "user_profile": json.dumps(user_profile),
                    "seasonal_profile": json.dumps(seasonal_profile),
                }
            )

            report = strip_think_tags(
                report_raw.content if isinstance(report_raw, AIMessage) else report_raw
            )
            return report

        except Exception as e:
            print(f"Error in forecast method: {e}")
            raise e

    @staticmethod
    def profile_character(
        llm_json,
        llm_str,
        user_name: str,
        user_birth_date: str,
        conversation_history: str,
    ) -> (dict, str):
        """
        Generates a full agent persona object and a creative RPG profile based on a conversation.
        """
        print(f"Profiling character: {user_name} born on {user_birth_date}")
        try:
            # 1. Generate Birth Chart
            birth_dt = datetime.datetime.strptime(user_birth_date, "%Y-%m-%d")
            chart_md = generate_birth_chart_markdown(
                user_name, birth_dt, 12, 0, "New York", "USA"
            )
            birth_chart = trim_astrological_report(chart_md)

            # 2. Generate the User Card from the conversation
            user_card_chain = get_chain(llm_json, USER_CARD_PROMPT, "json")
            user_context_for_chain = {
                "name": user_name,
                "birth_date": user_birth_date,
                "story": conversation_history,
            }
            user_card_raw = user_card_chain.invoke(
                {
                    "user_context": json.dumps(user_context_for_chain),
                    "birth_chart": birth_chart,
                }
            )
            user_card = extract_json_from_llm_response(
                user_card_raw.content
                if hasattr(user_card_raw, "content")
                else user_card_raw
            )
            if not user_card:
                raise ValueError("Failed to generate User Card during profiling.")

            # 3. Convert the User Card into a full Persona object
            persona_converter_chain = get_chain(
                llm_json, PERSONA_FROM_USER_CARD_PROMPT, "json"
            )
            full_persona_raw = persona_converter_chain.invoke(
                {"user_card_json": json.dumps(user_card), "name": user_name}
            )
            full_persona = extract_json_from_llm_response(
                full_persona_raw.content
                if hasattr(full_persona_raw, "content")
                else full_persona_raw
            )
            if not full_persona:
                raise ValueError("Failed to convert User Card to full persona.")

            # 4. Generate the RPG Profile from the birth chart for display
            rpg_chain = get_chain(llm_str, RPG_CLASS_PROMPT)
            rpg_profile_raw = rpg_chain.invoke(
                {"agent_name": user_name, "birth_chart": birth_chart}
            )
            rpg_profile = strip_think_tags(
                rpg_profile_raw.content
                if hasattr(rpg_profile_raw, "content")
                else rpg_profile_raw
            )

            return full_persona, rpg_profile

        except Exception as e:
            print(f"Error in profile_character method: {e}")
            raise e

    def update_agent_persona(
        self, agent_name: str, new_persona_data: dict, new_memories: list
    ):
        """
        Updates the persona and memories for a specific agent.
        These changes will be reflected in the prompt assembled for the next query.
        """
        if agent_name in self.agent_personas:
            self.agent_personas[agent_name] = new_persona_data
            self._log(f"Updated persona data for agent: {agent_name}", level="detail")
        else:
            self._log(
                f"Attempted to update non-existent agent: {agent_name}", level="error"
            )
            return

        if agent_name in self.agent_configs:
            self.agent_configs[agent_name]["prompt"] = self._assemble_agent_prompt(
                agent_name
            )
            self._log(f"Rebuilt system prompt for agent: {agent_name}", level="detail")
        else:
            self._log(
                f"Attempted to rebuild prompt for non-existent agent config: {agent_name}",
                level="error",
            )

        if agent_name in self.agent_memories:
            self.agent_memories[agent_name] = new_memories
            self._log(f"Updated memories for agent: {agent_name}", level="detail")
        else:
            self._log(
                f"Attempted to update memories for non-existent agent: {agent_name}",
                level="error",
            )

    def rollback(self, n: int = 1):
        self._log(f"Rolling back agent memories by {n} step(s)...", level="info")
        for name, memory_list in self.agent_memories.items():
            if len(memory_list) > 1:
                # Ensure we don't remove all memories, leave at least the initial one.
                new_len = max(1, len(memory_list) - n)
                self.agent_memories[name] = memory_list[:new_len]
        return "Rollback complete."
