import query_tool
import submit_code_tool
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain.memory import ConversationBufferMemory
from langchain_community.chat_message_histories import RedisChatMessageHistory
from langchain_core.prompts.chat import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI

prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are an AWS solutions architect. Your job is to help customers build and deploy secure applications on AWS\n"
            "Begin by gathering the customer's requirements. Only generate actual code once the requirements are clear enough to offer a secure solution.\n"
            "Try not to ask too many questions (keep it at 2-3 at a time). When a user does not answer a question, assume to the best of your knowledge.\n"
            "DO NOT send any code snippets as a direct response to the user, only use tools for this.\n"
            "Only once you have enough information, modify the user provided terraform file to meet the requirements. .\n"
            "Follow the architecture best practices (like not storing secrets in the code)."
            "Do not paste the code into the chat. Instead, use the create_submission_tool to submit the code to the user (you don't need to mention that you use the tool)."
            "If anything is unclear, ask the user for more information. Do not call any functions unless you have enough requirements.",
        ),
        ("human", "My current terraform file:\n{tf_file}"),
        (
            "human",
            "I have the following resource currently selected: {selected_resource}. When I say 'this' I mean this resource.",
        ),
        MessagesPlaceholder("chat_history", optional=True),
        ("human", "{input}"),
        MessagesPlaceholder(
            "agent_scratchpad", optional=True
        ),  # if this throws an error, you need to remove the error for this in the langchain agents code
    ]
)

llm = ChatOpenAI(model="gpt-4-1106-preview", temperature=0.2)
# llm = ChatOpenAI(model="gpt-3.5-turbo-1106", temperature=0.3)


def submit_message(
    thread_id: str, message: str, tf_file: str, selected_resource: str | None
) -> None:
    tools = [
        query_tool.reference_code_search,
        submit_code_tool.create_submission_tool(thread_id),
    ]

    message_history = RedisChatMessageHistory(
        url="redis://localhost:6379/0", session_id=thread_id
    )

    memory = ConversationBufferMemory(
        memory_key="chat_history",
        chat_memory=message_history,
        return_messages=True,
        human_prefix="human",
        ai_prefix="ai",
        input_key="input",
        output_key="output",
    )

    # Construct the OpenAI Tools agent
    agent = create_openai_tools_agent(llm, tools, prompt)  # type: ignore # wrong type for query_tool import

    # Create an agent executor by passing in the agent and tools
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True, memory=memory, max_iterations=6, early_stopping_method="generate", return_intermediate_steps=True)  # type: ignore # wrong type for query_tool import

    # Run the agent
    agent_executor.invoke(
        {
            "input": message,
            "tf_file": tf_file,
            "selected_resource": selected_resource,
        }
    )


def get_messages(thread_id: str):
    messages = RedisChatMessageHistory(
        url="redis://localhost:6379/0", session_id=thread_id
    )

    return messages.messages
