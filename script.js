// ============================================================
// J.A.R.V.I.S — GEMINI AI + VOICE ASSISTANT
// ============================================================


// ============================================================
// 1. GEMINI API KEY
// ============================================================

let API_KEY = localStorage.getItem("jarvis_key");

if (!API_KEY) {
    API_KEY = prompt("Enter your Gemini API Key:");

    if (API_KEY) {
        localStorage.setItem("jarvis_key", API_KEY);
    }
}


// ============================================================
// 2. GEMINI MODELS
// ============================================================

const MODELS = [
    "gemini-3.6-flash",
    "gemini-flash-latest"
];


// ============================================================
// 3. DOM ELEMENTS
// ============================================================

const chat = document.getElementById("chat");
const input = document.getElementById("msg");
const micBtn = document.getElementById("mic-btn");
const sendBtn = document.getElementById("send");


// ============================================================
// 4. GEMINI BRAIN
// ============================================================

async function callGemini(prompt) {

    let lastError;

    for (const model of MODELS) {

        try {

            const url =
                "https://generativelanguage.googleapis.com/v1beta/models/" +
                model +
                ":generateContent?key=" +
                API_KEY;

            const response = await fetch(url, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: prompt
                                }
                            ]
                        }
                    ]
                })

            });


            const data = await response.json();


            // API error
            if (data.error) {

                lastError = new Error(data.error.message);

                const errorMessage =
                    data.error.message || "";

                // Try next model for temporary/model/quota errors
                if (
                    /high demand|temporar|quota|rate|unavailable|no longer available|deprecated/i
                        .test(errorMessage)
                ) {
                    continue;
                }

                throw lastError;
            }


            // Make sure response exists
            if (
                !data.candidates ||
                !data.candidates[0] ||
                !data.candidates[0].content ||
                !data.candidates[0].content.parts
            ) {

                throw new Error("Invalid Gemini response.");

            }


            return data.candidates[0]
                .content
                .parts[0]
                .text;

        }

        catch (error) {

            lastError = error;

        }

    }


    throw lastError || new Error("Gemini request failed.");

}


// ============================================================
// 5. ASK GEMINI
// ============================================================

async function askGemini(prompt) {

    const thinkingMessage =
        add("J.A.R.V.I.S: Thinking...", "ai");

    try {

        const reply = await callGemini(prompt);

        thinkingMessage.innerText =
            "J.A.R.V.I.S: " + reply;

        // Speak Gemini response
        speak(reply);

    }

    catch (error) {

        thinkingMessage.innerText =
            "J.A.R.V.I.S: ERROR - " +
            error.message;

        console.error("Gemini Error:", error);

    }

}


// ============================================================
// 6. SPEECH RECOGNITION
// ============================================================

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


let rec = null;


if (SpeechRecognition) {

    rec = new SpeechRecognition();

    rec.lang = "en-US";

    rec.continuous = false;

    rec.interimResults = false;


    rec.onstart = () => {

        if (micBtn) {
            micBtn.innerText = "LISTENING...";
        }

    };


    rec.onresult = (event) => {

        const text =
            event.results[0][0].transcript;

        if (!text) return;

        add("YOU: " + text, "user");

        askGemini(text);

    };


    rec.onerror = (event) => {

        console.error(
            "Speech Recognition Error:",
            event.error
        );

        if (micBtn) {
            micBtn.innerText = "🎙️";
        }

    };


    rec.onend = () => {

        if (micBtn) {
            micBtn.innerText = "🎙️";
        }

    };


    if (micBtn) {

        micBtn.onclick = () => {

            try {

                rec.start();

            }

            catch (error) {

                console.error(error);

            }

        };

    }

}
else {

    console.warn(
        "Speech Recognition is not supported by this browser."
    );

    if (micBtn) {

        micBtn.disabled = true;
        micBtn.innerText = "🎙️";

    }

}


// ============================================================
// 7. TEXT-TO-SPEECH
// ============================================================

let voices = [];


function loadVoices() {

    voices =
        window.speechSynthesis.getVoices();

}


loadVoices();


if ("onvoiceschanged" in speechSynthesis) {

    speechSynthesis.onvoiceschanged =
        loadVoices;

}


function speak(text) {

    if (!text) return;

    // Stop previous speech
    speechSynthesis.cancel();


    const utterance =
        new SpeechSynthesisUtterance(text);


    // J.A.R.V.I.S-style voice settings
    utterance.rate = 1.05;
    utterance.pitch = 0.85;
    utterance.volume = 1;


    // Prefer English voice
    const voice =
        voices.find(v =>
            v.lang &&
            v.lang.toLowerCase().startsWith("en")
        );


    if (voice) {

        utterance.voice = voice;

    }


    speechSynthesis.speak(utterance);

}


// ============================================================
// 8. SEND BUTTON
// ============================================================

if (sendBtn) {

    sendBtn.onclick = () => {

        const text =
            input.value.trim();

        if (!text) return;


        add("YOU: " + text, "user");

        input.value = "";

        askGemini(text);

    };

}


// ============================================================
// 9. ENTER KEY
// ============================================================

if (input) {

    input.addEventListener("keydown", (event) => {

        if (event.key === "Enter") {

            event.preventDefault();

            sendBtn.click();

        }

    });

}


// ============================================================
// 10. ADD MESSAGE TO CHAT
// ============================================================

function add(text, who) {

    const div =
        document.createElement("div");

    div.className =
        "msg " + who;

    div.innerText = text;

    chat.appendChild(div);

    chat.scrollTop =
        chat.scrollHeight;

    return div;

}


// ============================================================
// 11. INITIAL J.A.R.V.I.S MESSAGE
// ============================================================

add(
    "J.A.R.V.I.S: Good day, Boss. All systems initialized.",
    "ai"
);
