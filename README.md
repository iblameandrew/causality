# Causality: A Social Simulation Sandbox PoC 🚀

<img width="1024" height="1024" alt="image" src="https://github.com/user-attachments/assets/bef7c8bc-a92a-477c-b0f8-401bbc71d10b" />


Hello and welcome! 👋 I'm so glad you've found your way to this little project of mine. Causality is a tool built with a simple, yet ambitious goal: to help us understand each other a little better. It’s a sandbox where you can safely explore the complex, often messy human world of social dynamics.

Think of it as a flight simulator for social situations and politics. It lets you test out actions and conversations in a simulated environment, populated by psychologically-grounded AI agents, so you can navigate real-life scenarios with more wisdom, confidence, and empathy. My hope is that it can be a truly empowering tool for personal growth. ❤️



## 💾 Installation

Getting started is pretty straightforward. Just follow these steps, and you'll have your own local social simulator running in no time!

**Prerequisites:**
*   Python 3.9+
*   Git
*   [Ollama](https://ollama.com/) (If you want to run models locally)

**Step 1: Clone the Repository**
First, open your terminal or command prompt and clone this repository to your local machine.

```bash
git clone https://github.com/iblameandrew/causality.git
cd causality
```

**Step 2: Create a Virtual Environment**
It's always a good practice to keep your project dependencies isolated.

*   On macOS / Linux:
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```
*   On Windows:
    ```bash
    python -m venv venv
    .\venv\Scripts\activate
    ```

**Step 3: Install Dependencies**
This project uses a `requirements.txt` file to manage its packages. Install them using pip.

```bash
pip install -r requirements.txt
```
*(You'll need to create a `requirements.txt` file with the contents from the `setup.py` and `app.py` files. It should look something like this:)*
```
# requirements.txt
langchain
langchain-google-genai
langchain-community
langchain_openai
langgraph
kerykeion
pytz
python-dotenv
tiktoken
streamlit
```

**Step 4: Set Up Your Environment Variables**
Unless running locally, the application needs API keys to connect to various LLM providers.

1.  Make a file named `.env.example` in the project folder.
2.  Duplicate it and rename the copy to just `.env`.
3.  Open the new `.env` file and add your API keys.

```plaintext
# .env file

# For Google Gemini
GEMINI_API_KEY="your_google_api_key_here"

# For OpenRouter.ai
OPEN_ROUTER="your_openrouter_api_key_here"
OPENROUTER_BASE_URL="https://openrouter.ai/api/v1"


# For Longcat
LONGCAT_API="your_longcat_api_key_here"
LONGCAT_URL="your_longcat_api_base_url_here"

# You don't need to fill out all of them, just the ones for the services you plan to use.
# If you are only using Ollama for local models, you can leave this file blank.
```

**Step 5: Run the App!**
You're all set! Start the Streamlit application with the following command:

```bash
streamlit run app.py
```

Your web browser should automatically open a new tab with the Causality interface. Enjoy your first simulation!

---

## ✨ Core Functionalities

Causality is more than just a chatbot; it's a dynamic multi-agent system designed to model the ripple effects of our actions. Here's a breakdown of what you can do:

### 🌐 Network Simulation

1.  **Define Your Scenario:** You start by describing a situation. It could be anything—navigating a new role at work, resolving a conflict with a friend, or pitching a risky idea.
2.  **Create the Network:** Based on your story, the app generates a network of unique AI personas (`NPCs`). Each one has a distinct psychological profile, complete with fears, desires, skills, and a unique way of seeing the world.
3.  **Take an Action:** You then input an action you want to take within that scenario (e.g., "I'm going to praise my teammate's work in the public channel").
4.  **Observe the Ripple Effect:** The simulation runs! Each AI agent reacts based on its core personality. You'll get:
    *   **A Strategic Debrief:** A high-level analysis of how your action was perceived, identifying your allies, opponents, and the underlying reasons for their reactions.
    *   **Group Perception Analysis:** An objective summary of your current social standing.
    *   **The "Council Score":** A fascinating breakdown of how 16 different archetypal personalities would judge your action, helping you see it from many angles.
    *   **Agent-Level Breakdown:** Dive deep into the mind of each agent. See what specific personality traits and goals your action triggered, and why they reacted the way they did.

### 👤 The Profiler
Want to create a specific character? The Profiler is your tool.
*   **Guided Interview:** Engage in a conversation with an AI "interrogator" to flesh out a character's backstory, goals, and conflicts.
*   **Generate a Persona:** Once you've provided enough context, the app generates a complete psychological profile for your character.
*   **Astrological RPG Class:** For a bit of fun and narrative flavor, it also creates a unique, fantasy RPG class for your character based on their "celestial blueprint."
*   **Import into Simulations:** Any character you create can be saved and directly imported into your network simulations!



### 🧠 Memory & Agent Management
The simulation has a memory!
*   **Rollback:** Did a turn not go as planned? You can roll back the agents' memories to a previous state and try a different approach.
*   **Direct Editing:** You have full control. Dive into any agent's profile and directly edit their personality attributes, goals, fears, or even their memories to fine-tune the simulation.

## 💼 The Marketable Value: Why Simulate Social Scenarios?

In a world where collaboration is key, the ability to navigate complex social landscapes is a superpower. Stagnant or politically charged environments are often "zero-sum games" where one person's gain is another's loss. Simulating these scenarios provides an incredible strategic advantage.

**This isn't just a toy; it's a powerful training tool.**

*   **Empowerment Through Foresight:** By running simulations, you move from *reacting* to situations to *architecting* them. You gain the foresight to understand how your actions might be perceived *before* you take them, allowing you to choose your words and deeds wisely to achieve the best possible outcome.

*   **A Game-Changer for Human Resources 🏢:** Imagine an HR manager trying to resolve a conflict between two employees. Instead of guessing, they can create a simulation of the office environment, input the conflict details, and test various mediation strategies to see which is most likely to lead to a peaceful resolution. It’s an invaluable tool for conflict resolution, team building, and navigating any awkward office scenario where the outcome is unknown.

*   **Mastering Dense Politics & Zero-Sum Scenarios 🏛️:** For leaders, managers, and consultants, this tool is a strategic godsend. You can model the political landscape of a boardroom or a team, understand the hidden fears and desires of each stakeholder, and craft a strategy that navigates dense politics with precision and empathy.

*   **A Safe Haven for Social Anxiety 🤗:** For anyone who feels anxious in social situations, this app offers a safe, private space to practice. You can rehearse difficult conversations, learn to anticipate reactions, and build confidence at your own pace without any real-world risk. It's about building muscle memory for social success.

## A Personal Note on the Method 🔮

I'll be the first to admit it—the profiling engine uses some esoteric frameworks as its foundation (specifically, archetypal psychology derived from astrological principles). I know this might raise an eyebrow, and I approach it with humility.

However, the magic happens when these timeless, symbolic frameworks are combined with the power of modern Large Language Models (LLMs). The LLMs translate the esoteric data into agnostic, psychologically-grounded, and actionable personality profiles that work incredibly well for modeling human behavior in these simulations. It's an unconventional pairing, but the results in creating believable, dynamic NPCs are truly remarkable.

## ⚙️ System Requirements & A Note on Quality

*   **It's Free! 🎁:** This tool is open-source and free to use. My goal is to make it accessible to anyone who might find it helpful.
*   **Dialogue Quality Scales with Model Power:** The realism of the simulation is directly tied to the quality of the LLM you use. The NPCs' dialogues and reactions become significantly more lifelike and emotionally nuanced when run on models that rank highly on emotional quotient (EQ) benchmarks.
*   **Minimum Viable Model:** For the simulation to function with a baseline level of coherence, the minimum recommended model is **`qwen30b-a3b-2507`** or a model with equivalent capabilities.

## 🤝 Let's Build the Future Together

Looking for a co-founder. I'm a developer with a passion for this idea (enhancing social skills through simulations), but I know that to truly scale it, I need help. Causality is just the beginning. I envision a future with far more complex multi-agent simulations—modeling entire organizations. This, of course, requires significant compute power and a solid business strategy.

If you are a business-savvy person who sees the potential in this idea and believes it could be useful to others, I would be thrilled to collaborate. Together, we could build a platform that helps thousands of people and organizations navigate their worlds with greater understanding. My email: andresulloa97@gmail.com

Thank you for your time and interest. I truly hope you find this tool as helpful as I do.
