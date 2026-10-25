import type {Metadata} from 'next';
export const metadata: Metadata={title:'CodeAtlas — understand your project',description:'Explore, edit, and learn from your code with a source-grounded project tutor.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
