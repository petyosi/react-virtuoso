import { rand, randFullName, randPhrase, randNumber } from "@ngneat/falso";

export class ChatChannel {
  constructor(name, totalMessages) {
    this.name = name;
    this.totalMessages = totalMessages;
    this.localIdCounter = 0;
    this.messages = [];
    this.onNewMessages = (messages) => {
      void messages;
    };
    this.loading = false;
    this.loaded = false;
    this.users = Array.from({ length: 2 }, (_, i) => new ChatUser(i));
    this.currentUser = this.users[0];
    this.otherUser = this.users[1];
    if (this.totalMessages === 0) {
      this.loaded = true;
    }
  }
  async getMessages(params) {
    if (this.loading) {
      return null;
    }
    this.loading = true;
    await new Promise((r) => setTimeout(r, 1000));
    const { limit = 10 } = params;
    this.loading = false;
    if (!this.loaded) {
      this.loaded = true;
    }
    if (this.messages.length >= this.totalMessages) {
      return [];
    }
    // prepending messages, simplified for the sake of the example
    //
    if ("before" in params) {
      if (this.messages.length >= this.totalMessages) {
        return [];
      }
      const offset = this.totalMessages - this.messages.length - limit;
      const newMessages = Array.from({ length: limit }, (_, i) => {
        const id = offset + i;
        return new ChatMessage(id, rand(this.users));
      });
      this.messages = newMessages.concat(this.messages);
      return newMessages;
    } else {
      // initial load
      this.messages = Array.from({ length: limit }, (_, i) => {
        const id = this.totalMessages - limit + i;
        return new ChatMessage(id, rand(this.users));
      });
      return this.messages;
    }
  }
  createNewMessageFromAnotherUser() {
    const newMessage = new ChatMessage(this.messages.length, this.otherUser);
    this.messages.push(newMessage);
    this.onNewMessages([newMessage]);
  }
  sendOwnMessage() {
    const tempMessage = new ChatMessage(null, this.currentUser);
    tempMessage.localId = ++this.localIdCounter;
    tempMessage.delivered = false;
    setTimeout(() => {
      const deliveredMessage = new ChatMessage(
        this.messages.length,
        this.currentUser,
        tempMessage.message,
      );
      deliveredMessage.localId = tempMessage.localId;
      this.messages.push(deliveredMessage);
      this.onNewMessages([deliveredMessage]);
    }, 1000);
    return tempMessage;
  }
}
export class ChatUser {
  constructor(
    id,
    name = randFullName(),
    avatar = `https://i.pravatar.cc/30?u=${encodeURIComponent(name)}`,
  ) {
    this.id = id;
    this.name = name;
    this.avatar = avatar;
  }
}
// a ChatMessage class with a random message, user
export class ChatMessage {
  constructor(
    id,
    user,
    message = randPhrase({
      length: randNumber({ min: 1, max: 2 }),
    }).join(" "),
  ) {
    this.id = id;
    this.user = user;
    this.message = message;
    this.delivered = true;
    this.localId = null;
  }
}
