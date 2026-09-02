import { AstryxProvider } from "@/components/AstryxProvider";

/**
 * Astryx-провайдер оборачивает ТОЛЬКО /login (route-сегмент), а не корневой
 * app/layout.tsx. Причина: Theme — "root"-провайдер (первый Theme без
 * родителя в дереве) синхронизирует data-astryx-theme на <html>, и
 * theme-neutral CSS использует `@scope([data-astryx-theme="neutral"])`.
 * Если атрибут висит на <html>, скоуп раскрывается на весь документ и
 * перекрашивает даже необработанные Astryx-страницы (проверено: у h1 на
 * /signup цвет менялся на токен Astryx). Обёртка на уровне сегмента даёт
 * Theme свой собственный wrapping <div data-astryx-theme="neutral">, не
 * являющийся root-провайдером — синхронизация на <html> пропускается,
 * @scope остаётся внутри /login.
 */
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AstryxProvider>{children}</AstryxProvider>;
}
