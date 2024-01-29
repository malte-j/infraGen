export interface UserChatMessageCommand {
  command: "userChatMessage";
  text: string;
  selectedResource?: string;
}

export interface GetMessagesCommand {
  command: "getMessages";
}

export interface NewThreadCommand {
  command: "newThread";
}

export type UserCommmands = UserChatMessageCommand | GetMessagesCommand | NewThreadCommand;
