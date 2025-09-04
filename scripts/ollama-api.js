// ollama-api.js

export async function getIeltsAssessment(
  text,
  displayImage
) {
  const ollamaUrl = "http://localhost:11434/api/generate";
  const modelName = "llava";

  try {
    // Fetch the image and convert it to base64
    const imageUrl = displayImage.src;
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    await new Promise((resolve) => (reader.onloadend = resolve));
    const base64Image = reader.result.split(",")[1];

    const prompt = `You are an expert IELTS Speaking examiner. The user has described an image. Your task is to:
    1.  Provide your own concise description of the image.
    2.  Compare your description with the user's transcribed text, which is: "${text}".
    3.  Provide a detailed assessment of the user's response based on the comparison, focusing on accuracy and descriptive quality.`;

    const payload = {
      model: modelName,
      prompt: prompt,
      images: [base64Image],
      stream: false,
    };

    const ollamaResponse = await fetch(ollamaUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!ollamaResponse.ok) {
      throw new Error(
        `HTTP error! status: ${ollamaResponse.status}. Make sure Ollama is running and configured for CORS.`
      );
    }

    const data = await ollamaResponse.json();
    
    // Get the specific token counts from the response
    const promptTokens = data.prompt_eval_count || 0;
    const completionTokens = data.eval_count || 0;
    const totalTokens = promptTokens + completionTokens;
    
    // Log both values
    console.log(`Prompt tokens: ${promptTokens}, Total tokens used: ${totalTokens}`);

    return data.response;
  } catch (error) {
    throw error;
  }
}

export async function getModelInfo(modelName) {
  const ollamaUrl = "http://localhost:11434/api/show";

  try {
    const payload = {
      name: modelName
    };

    const ollamaResponse = await fetch(ollamaUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!ollamaResponse.ok) {
      throw new Error(
        `HTTP error! status: ${ollamaResponse.status}. Make sure Ollama is running.`
      );
    }

    const data = await ollamaResponse.json();
    // In the latest version of the API, `data.modelfile` contains the info.
    return data.modelfile;
  } catch (error) {
    throw error;
  }
}
