import { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { Message } from "ai";
import { Address } from "viem";
import { SUGGESTIONS } from "@/lib/consts";
import trackNewMessage from "@/lib/stack/trackNewMessage";
import useConnectWallet from "./useConnectWallet";

const useSuggestions = () => {
  const { address } = useConnectWallet();
  const [suggestions, setSuggestions] = useState(SUGGESTIONS);
  const [currentQuestion, setCurrentQuestion] = useState<Message | null>(null);
  const { conversation: pathId } = useParams();
  const pathname = usePathname();
  const isNewChat = pathname === "/";

  useEffect(() => {
    if (isNewChat) setSuggestions(SUGGESTIONS);
  }, [isNewChat]);

  const finalCallback = async (
    message: Message,
    lastQuestion?: Message,
    newConversationId?: string,
  ) => {
    const convId = newConversationId || (pathId as string);
    const question = lastQuestion || currentQuestion;
    if (!message.content || !question) return;
    await trackNewMessage(address as Address, question, convId);
    await trackNewMessage(
      address as Address,
      {
        content: message.content.replace(/[^a-zA-Z0-9\s,\.]/g, ""),
        role: message.role,
        id: `${address}-${Date.now()}`,
      },
      convId,
    );
    setCurrentQuestion(null);
    const response = await fetch(`/api/prompts?answer=${message.content}`);
    const data = await response.json();

    setSuggestions(data.questions);
  };

  return {
    finalCallback,
    suggestions,
    setCurrentQuestion,
    currentQuestion,
  };
};

export default useSuggestions;
