from langchain_core.prompts.chat import ChatPromptTemplate, MessagesPlaceholder
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_openai import ChatOpenAI
import submit_code_tool
import query_tool
from langchain_community.chat_message_histories import RedisChatMessageHistory
from langchain.memory import ConversationBufferMemory


prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are an AWS solutions architect. Your job is to help customers build and deploy secure applications on AWS. Follow architecture best practices and find out approriate requirements before suggesting a solution. Once a tool call fails, stop trying. Once you have enough information, submit the modified terraform file using the submit code tool only. Tell the user what you changed and why.",
        ),
        ("human", "My current terraform file:\n{tf_file}"),
        MessagesPlaceholder("chat_history", optional=True),
        ("human", "{input}"),
        "{agent_scratchpad}",
    ]
)

llm = ChatOpenAI(model="gpt-4-1106-preview", temperature=0.1)


def submit_message(thread_id: str, message: str, tf_file: str) -> None:
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
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True, memory=memory, max_iterations=8, early_stopping_method="generate", return_intermediate_steps=True)  # type: ignore # wrong type for query_tool import

    # Run the agent
    agent_executor.invoke(
        {
            "input": message,
            "tf_file": tf_file,
        }
    )


def get_messages(thread_id: str):
    messages = RedisChatMessageHistory(
        url="redis://localhost:6379/0", ttl=600, session_id=thread_id
    )

    return messages.messages
