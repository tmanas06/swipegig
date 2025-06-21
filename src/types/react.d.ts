import 'react';

declare module 'react' {
  // Add any missing React types here if needed
  type FC<P = {}> = React.FunctionComponent<P>;
  type ReactNode = React.ReactNode;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      div: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
      span: React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;
      h1: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      // Add other HTML elements as needed
    }
  }
}
