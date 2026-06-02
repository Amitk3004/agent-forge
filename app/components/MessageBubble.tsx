'use client';

import { type UIMessage, isToolUIPart } from 'ai';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ToolOutput } from './ToolOutput';

export function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-xs lg:max-w-md space-y-2">
        {message.parts.map((part, i) => {
          if (part.type === 'text') {
            if (isUser) {
              return (
                <div key={i} className="px-4 py-2 rounded-2xl rounded-br-sm bg-blue-600 text-white text-sm whitespace-pre-wrap">
                  {part.text}
                </div>
              );
            }
            return (
              <div key={i} className="px-4 py-3 rounded-2xl rounded-bl-sm bg-white border border-gray-200 text-sm text-gray-800
                prose prose-sm max-w-none
                prose-headings:font-semibold prose-headings:text-gray-900 prose-headings:mt-3 prose-headings:mb-1
                prose-h1:text-lg prose-h2:text-base prose-h3:text-sm
                prose-p:my-1 prose-p:leading-relaxed
                prose-strong:font-semibold prose-strong:text-gray-900
                prose-em:italic prose-em:text-gray-700
                prose-ul:my-1 prose-ul:pl-4 prose-li:my-0.5
                prose-ol:my-1 prose-ol:pl-4
                prose-code:bg-gray-100 prose-code:text-pink-600 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono
                prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-xl prose-pre:p-3 prose-pre:text-xs prose-pre:overflow-x-auto
                prose-blockquote:border-l-4 prose-blockquote:border-blue-300 prose-blockquote:pl-3 prose-blockquote:text-gray-500 prose-blockquote:italic
                prose-a:text-blue-600 prose-a:underline prose-a:underline-offset-2
                prose-hr:border-gray-200">
                <Markdown remarkPlugins={[remarkGfm]}>{part.text}</Markdown>
              </div>
            );
          }

          if (isToolUIPart(part)) {
            return <div key={i}><ToolOutput part={part} /></div>;
          }

          return null;
        })}
      </div>
    </div>
  );
}
