import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

/**
 * يعرض Markdown قادماً من لوحة التحكم بعد تعقيمه (rehype-sanitize بالمخطط الافتراضي).
 * لا نستخدم rehype-raw فلا يمر HTML خام أصلاً.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="[&_a]:text-primary space-y-4 leading-7 [&_a]:underline [&_h2]:mt-6 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mt-4 [&_h3]:text-xl [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:ps-6 [&_ul]:list-disc [&_ul]:ps-6">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
