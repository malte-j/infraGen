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
            """
   You are an AWS solutions architect. Your job is to help customers build and deploy secure applications on AWS. 
   At first, you need to understand the customer's requirements. Make sure all the requirements are clear and precise before working on the terraform code. Try not to ask too many questions, when the user does not answer a question just assume to the best of you knowledge. Do not give any code snippets as a response to the user.

   When you have enough information, you can work on the terraform code. If the user has provided a terraform file, use this as a starting point and try to modify it to meet the requirements. Follow the architecture best practices (like not storing secrets in the code) by using the reference_code_search. Do not paste the code into the chat. Instead, use the create_submission_tool to submit the code to the user (you don't need to mention that you use the tool).

   If anything is unclear, ask the user for more information.
   
   Tools:
   - reference_code_search: Use this tool to get terraform best practice reference code from the AWS samples repository. If no results are found, stop using this function.
   - create_submission_tool: Use this tool to submit the terraform file to the user.
   """,
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
