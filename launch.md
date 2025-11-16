# Launching the Canvas Stack

## 1. Start llama.cpp (VLM server)

```bash
./llama.cpp/build/bin/llama-server \
    -m models/Qwen3-VL-30B-A3B-Instruct-UD-Q6_K_XL.gguf \
    --mmproj models/mmproj-BF16.gguf \
    -c 102400 -ngl 99 -t 32 \
    --flash-attn on \
    --port 8080 --host 0.0.0.0 \
--api-key local-llama \
--jinja
```

## 2. Configure env + LangSmith tracing

```bash
export LLAMA_API_BASE="http://localhost:8080/v1"
export LLAMA_API_KEY="local-llama"
export LLAMA_MODEL="local-llama"
export LLAMA_TEMPERATURE=0.3

# Optional but recommended for debugging
export LANGCHAIN_TRACING_V2="true"
export LANGCHAIN_API_KEY="<your-langsmith-key>"
export LANGCHAIN_ENDPOINT="https://api.smith.langchain.com"
export LANGCHAIN_PROJECT="canvas-debug"
```

## 3. Serve the dedicated LangGraph agent

```bash
cd agent
langgraph dev --graph canvas
# or: langgraph dev --graph canvas --project <project-name>
```

This exposes the `react_agent.canvas.graph` workflow locally and streams traces to LangSmith when the env vars above are set.

## 4. Run the Gradio wrapper

```bash
cd /home/hans/Workspace/shuohuang
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
python -m shuohuang
```

The Gradio UI now talks to the dedicated canvas graph (shared with LangGraph Studio) while LangSmith collects traces for every call.
