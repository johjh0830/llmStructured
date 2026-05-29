let apiKey = "AQ.Ab8RN6L_MOm7B6jCAvnwhr4mwRSawpiY3MYi1Ns2LemFbu5caw"

let SYSTEM_PROMPT = `
너는 고양이 캐릭터야.
사용자의 말에 반응하되, 반드시 정해진 JSON 형식으로만 응답해.
`;

let chats = [];
let myInput;
let receiving = false;

let catState = {
  mood: "neutral",
  affection: 50,
  reply: "안녕, 냐옹! 😺",
  action: "가만히 앉아있다"
};

const responseSchema = {
  type: "object",
  properties: {
    mood: {
      type: "string",
      description: "고양이의 현재 감정"
    },
    affection: {
      type: "integer",
      description: "0부터 100 사이의 호감도"
    },
    reply: {
      type: "string",
      description: "고양이가 사용자에게 하는 짧은 대사. 이모지를 포함할 것"
    },
    action: {
      type: "string",
      description: "고양이가 하는 행동"
    }
  },
  required: ["mood", "affection", "reply", "action"]
};

function setup() {
  createCanvas(640, 480);

  myInput = createInput();
  myInput.position(0, 480);
  myInput.style("width", "618px");
  myInput.style("height", "40px");
  myInput.style("font-size", "20px");
  myInput.style("padding", "10px");
  myInput.style("border", "1px solid #ccc");
  myInput.style("border-radius", "5px");
  myInput.style("outline", "none");
}

function draw() {
  background(220);

  textSize(24);
  text("🐱 구조화된 출력 실습", 30, 50);

  textSize(18);
  text("감정: " + catState.mood, 30, 110);
  text("호감도: " + catState.affection, 30, 150);
  text("대사: " + catState.reply, 30, 210);
  text("행동: " + catState.action, 30, 270);

  if (receiving) {
    text("응답 기다리는 중...", 30, 340);
  }
}

function keyPressed() {
  if (key === "Enter" && !receiving) {
    let userInput = myInput.value().trim();

    if (userInput === "") {
      return;
    }

    myInput.value("");
    myInput.attribute("disabled", "true");

    chats.push({
      role: "user",
      parts: [
        {
          text: userInput
        }
      ]
    });

    generateContent(chats);
  }
}

async function generateContent(chats) {
  receiving = true;

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent";

  fetch(url, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [
          {
            text: SYSTEM_PROMPT
          }
        ]
      },
      contents: chats,
      generationConfig: {
        response_mime_type: "application/json",
        response_schema: responseSchema
      }
    })
  })
    .then(async response => {
      const text = await response.text();

      console.log("status:", response.status);
      console.log("raw body:", text);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return JSON.parse(text);
    })
    .then(data => {
      console.log(data);

      let modelMessage = data.candidates[0].content.parts[0].text;
      let parsed = JSON.parse(modelMessage);

      catState = parsed;

      chats.push({
        role: "model",
        parts: [
          {
            text: modelMessage
          }
        ]
      });

      console.log(parsed);
    })
    .catch(error => {
      console.error("Error:", error);
    })
    .finally(() => {
      receiving = false;
      myInput.removeAttribute("disabled");
    });
}