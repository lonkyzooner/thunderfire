const PINECONE_API_KEY = import.meta.env.VITE_PINECONE_API_KEY;
const PINECONE_ENVIRONMENT = 'aped-4627-b74a'; // Updated environment
const PINECONE_INDEX = 'lark-knowledge'; // Index name
const PINECONE_NAMESPACE = 'default'; // Namespace if any

export async function queryPinecone(embedding: number[], topK = 5): Promise<string[]> {
  const url = `https://${PINECONE_INDEX}-${PINECONE_ENVIRONMENT}.svc.pinecone.io/query`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': PINECONE_API_KEY,
      },
      body: JSON.stringify({
        vector: embedding,
        topK,
        namespace: PINECONE_NAMESPACE,
        includeMetadata: true,
      }),
    });

    const data = await response.json();

    const matches = data.matches || [];
    const snippets = matches.map((match: any) => match.metadata?.text || '');

    return snippets;
  } catch (error) {
    console.error('[Pinecone] Query error:', error);
    return [];
  }
}