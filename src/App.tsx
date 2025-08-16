import React, { useState, useEffect } from "react";
import LoginForm from "./loginform";
import "./index.css";
import "./app.css";
import { Anthropic } from "@anthropic-ai/sdk";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export default function App() {
  const [user, setUser] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [tasks, setTasks] = useState<string[]>([]);
  const [strengths, setStrengths] = useState<string[]>([]);
  const [completed, setCompleted] = useState<boolean[]>([]);
  const [xp, setXp] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [skillXp, setSkillXp] = useState<{ [key: string]: number }>({
    "Technical Skills": 0,
    "Focus": 0,
    "Strength": 0,
    "Intelligence": 0,
    "Creativity": 0,
  });

  const [wizardChallenge, setWizardChallenge] = useState<string | null>(null);
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState<number | null>(null);
  const [isGeneratingChallenge, setIsGeneratingChallenge] = useState(false);

  const strengthsList = [
    "Technical Skills",
    "Focus",
    "Strength",
    "Intelligence",
    "Creativity",
  ];

  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      const docRef = doc(db, "quests", user);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTasks(data.tasks || []);
        setStrengths(data.strengths || []);
        setCompleted(data.completed || []);
        setXp(data.xp || 0);
        setLevel(data.level || 1);
        setSkillXp(
          data.skillXp || {
            "Technical Skills": 0,
            "Focus": 0,
            "Strength": 0,
            "Intelligence": 0,
            "Creativity": 0,
          }
        );
      } else {
        setTasks([]);
        setStrengths([]);
        setCompleted([]);
        setXp(0);
        setLevel(1);
        setSkillXp({
          "Technical Skills": 0,
          "Focus": 0,
          "Strength": 0,
          "Intelligence": 0,
          "Creativity": 0,
        });
      }
    };

    fetchUserData();
  }, [user]);


  const handleTaskChange = (index: number, value: string) => {
    const updatedTasks = [...tasks];
    const oldTask = updatedTasks[index];
    updatedTasks[index] = value;
    setTasks(updatedTasks);

    const updatedCompleted = [...completed];
    if (value !== oldTask) updatedCompleted[index] = false; 
    setCompleted(updatedCompleted);
  };

  const handleStrengthChange = (index: number, value: string) => {
    const updatedStrengths = [...strengths];
    updatedStrengths[index] = value;
    setStrengths(updatedStrengths);
  };

  const handleSubmit = async () => {
    setShowPopup(false);

    const updatedTasks = [...tasks];
    while (updatedTasks.length < 7) updatedTasks.push("");

    const updatedStrengths = [...strengths];
    while (updatedStrengths.length < 7) updatedStrengths.push("");

    const updatedCompleted = [...completed];
    while (updatedCompleted.length < 7) updatedCompleted.push(false);

    setTasks(updatedTasks);
    setStrengths(updatedStrengths);
    setCompleted(updatedCompleted);

    await setDoc(doc(db, "quests", user!), {
      tasks: updatedTasks,
      strengths: updatedStrengths,
      completed: updatedCompleted,
      level,
      xp,
      skillXp,
    });
  };

  const toggleComplete = async (index: number) => {
    const updatedCompleted = [...completed];
    const wasCompleted = updatedCompleted[index];
    updatedCompleted[index] = !wasCompleted;
    setCompleted(updatedCompleted);

    let newXp = xp;
    let newLevel = level;
    const updatedSkillXp = { ...skillXp };
    const skill = strengths[index];

    if (!wasCompleted) {
      // Completing task
      newXp += 10;
      updatedSkillXp[skill] = (updatedSkillXp[skill] + 10);
      if (updatedSkillXp[skill] > 50) {
        updatedSkillXp[skill] = 0; 
      }
      if (newXp >= 100) {
        newXp = 0;
        newLevel += 1;
      }
    } else {
      newXp -= 10;
      updatedSkillXp[skill] = Math.max(updatedSkillXp[skill] - 10, 0);
      if (newXp < 0) {
        if (newLevel > 1) {
          newLevel -= 1;
          newXp = 90;
        } else {
          newXp = 0;
        }
      }
    }

    setXp(newXp);
    setLevel(newLevel);
    setSkillXp(updatedSkillXp);

    await setDoc(doc(db, "quests", user!), {
      tasks,
      strengths,
      completed: updatedCompleted,
      level: newLevel,
      xp: newXp,
      skillXp: updatedSkillXp,
    });
  };

  const fetchWizardChallenge = async () => {
    if (!tasks.length) return;

    const randomIndex = Math.floor(Math.random() * tasks.length);
    setCurrentChallengeIndex(randomIndex);

    const task = tasks[randomIndex];
    const skill = strengths[randomIndex];

    setIsGeneratingChallenge(true);

    try {
      const client = new Anthropic({ 
        apiKey: import.meta.env.VITE_CLAUDE_API_KEY,
        dangerouslyAllowBrowser: true
      });

      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 200,
        messages: [{
          role: "user",
          content: `Give me a simple, direct challenge to help complete this specific task: "${task}". Focus only on this exact task. Make it actionable and achievable in 1-2 hours. Use simple language. No emojis, badges, or gamification elements. Just a clear, practical suggestion. Keep it under 30 words.`
        }]
      });

      const challengeText = (response.content[0] as any).text;
      setWizardChallenge(challengeText);
    } catch (error) {
      console.error("Error fetching challenge:", error);
      setWizardChallenge(`Challenge: Complete "${task}" with extra focus on ${skill}. Set a timer for 90 minutes and eliminate all distractions!`);
    } finally {
      setIsGeneratingChallenge(false);
    }
  };

  if (!user) {
    return (
      <div className="centered-logo" style={{ flexDirection: "column" }}>
        <img
          src="/questylogin.PNG"
          alt="Questy Logo"
          style={{
            width: "400px",
            height: "auto",
            imageRendering: "pixelated",
          }}
        />
        <LoginForm onLogin={(email) => setUser(email)} />
      </div>
    );
  }

  return (
    <>
     
    <div className="welcome-message">
      WELCOME,
      <br />
      {user.toUpperCase()}!
    </div>

      <div className="skills-wrapper">
        <img src="/skills.png" alt="Pixel Art" className="pixel-art" />

        {/* Skill XP overlays */}
        {strengthsList.map((s) => (
          <div
            key={s}
            className={`skill-overlay ${s.toLowerCase().replace(" ", "-")}`}
          >
            <div className="skill-label">{s}</div>
            <img
              src={`/xp-${skillXp[s]}.png`}
              alt={`${s} XP`}
              className="skill-xp-bar"
            />
          </div>
        ))}
      </div>

      <div className="level-text">LV: {level}</div>
      <div className="xp-text">XP: {xp} / 100</div>

    
      {/* Wizard section */}
      <img src="/wizardllm.png" alt="Wizard LLM Pixel Art" className="wizard-art" />

      <div className="wizard-challenge-container">
        <button 
          className="generate-challenge-btn" 
          onClick={fetchWizardChallenge}
          disabled={isGeneratingChallenge}
        >
          {isGeneratingChallenge ? "Generating..." : "Generate Challenge"}
        </button>

        {wizardChallenge && currentChallengeIndex !== null && (
          <div className="wizard-challenge-overlay">
            <p>{wizardChallenge}</p>
            <button
              onClick={async () => {
                let newXp = xp + 10; 
                let newLevel = level;
                const updatedSkillXp = { ...skillXp };
                const skill = strengths[currentChallengeIndex];

                updatedSkillXp[skill] = (updatedSkillXp[skill] + 10);
                if (updatedSkillXp[skill] > 50) {
                  updatedSkillXp[skill] = 0; 
                }
                
                if (newXp >= 100) {
                  newXp -= 100;
                  newLevel += 1;
                }

                setXp(newXp);
                setLevel(newLevel);
                setSkillXp(updatedSkillXp);

                setWizardChallenge(null);
                setCurrentChallengeIndex(null);

                await setDoc(doc(db, "quests", user!), {
                  tasks,
                  strengths,
                  completed,
                  level: newLevel,
                  xp: newXp,
                  skillXp: updatedSkillXp,
                });
              }}
            >
              Complete Challenge (+10 XP)
            </button>
          </div>
        )}
      </div>

      <div className="quests-container">
        <img src="/quests.png" alt="Quests Pixel Art" className="quests-art" />
        <div className="quests-title">QUESTS</div>
        <div className="quests-edit" onClick={() => setShowPopup(true)}>
          EDIT
        </div>

        {tasks.length > 0 && (
          <ul className="quests-list">
            {tasks.map((task, i) => (
              <li
                key={i}
                className={completed[i] ? "completed" : ""}
                onClick={() => toggleComplete(i)}
              >
                {task} - <span>{strengths[i]}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup">
            <h2>Enter Your 7 Tasks</h2>
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="task-input">
                <input
                  type="text"
                  placeholder={`Task ${i + 1}`}
                  value={tasks[i] || ""}
                  onChange={(e) => handleTaskChange(i, e.target.value)}
                />
                <select
                  value={strengths[i] || ""}
                  onChange={(e) => handleStrengthChange(i, e.target.value)}
                >
                  <option value="">Select Strength</option>
                  {strengthsList.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            <button onClick={handleSubmit}>Save</button>
          </div>
        </div>
      )}
    </>
  );
}