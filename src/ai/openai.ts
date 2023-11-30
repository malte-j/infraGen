import OpenAI from "openai";
const openai = new OpenAI({
  apiKey: "",
});

export async function getUpdatedTFFile(tfFile: string, command: string) {
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "You are a solutions architect at AWS. The user gives you instructions and you have to modify a provided Terraform file. When you receive an instruction from the user, output only the modified Terraform file, nothing else. Always start your reply with <start_of_tf_file> and end it with <end_of_tf_file>.",
      },
      {
        role: "user",
        content: "<start_of_tf_file>\n" + tfFile + "\n<end_of_tf_file>\n",
      },
      { role: "user", content: command },
    ],
    model: "gpt-3.5-turbo",
  });

  if (completion.choices[0].message.content) {
    return completion.choices[0].message.content
      .replace("<start_of_tf_file>\n", "")
      .replace("\n<end_of_tf_file>", "");
  } else {
    return "";
  }
}

export async function generateDiagram(tfFile: string) {
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "Create a diagram from the following Terraform file. Output the content of a python file using the diagrams package. Your reply starts with 'from diagrams import Diagram' and contains only the code necessary to create the diagram.",
      },
      {
        role: "system",
        content: `Available imports: from diagrams.aws.compute import EC2Instance
        from diagrams.aws.database import RDSInstance
        from diagrams.aws.storage import SimpleStorageServiceS3Bucket as S3Bucket`,
      },
      {
        role: "user",
        content: tfFile,
      },
    ],
    model: "gpt-3.5-turbo",
  });

  if (completion.choices[0].message.content) {
    // replace 'with Diagram ...' with: with Diagram("Grouped Workers", show=False, direction="TB", filename="/tmp/infragen/diagram" ):
    const modifiedCode = completion.choices[0].message.content.replace(
      /with Diagram.*?\n/,
      'with Diagram("Grouped Workers", show=False, direction="TB", filename="/tmp/infragen/diagram" ):\n'
    );

    await fetch("http://localhost:8000/diagram", {
      method: "POST",
      body: JSON.stringify({ code: modifiedCode }),
      headers: { "Content-Type": "application/json" },
    });
  } else {
    return "";
  }
}
