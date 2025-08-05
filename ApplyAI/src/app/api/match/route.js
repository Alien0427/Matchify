import formidable from 'formidable';
import { DocumentConverter } from 'docling';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { RetrievalQAChain } from 'langchain/chains';
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { NextResponse } from 'next/server';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: false });
    form.parse(req, async (err, fields, files) => {
      if (err) return resolve(NextResponse.json({ error: err.message }, { status: 400 }));
      try {
        const jobs = JSON.parse(fields.jobs);
        const resumePath = files.resume.filepath;
        // 1. Extract resume content using Docling
        const converter = new DocumentConverter();
        const result = await converter.convert(resumePath);
        const resumeText = result.document.export_to_markdown();
        // 2. LLM prompt for comparison
        const chat = new ChatOpenAI({ temperature: 0 });
        // If job set is large, use LlamaIndex (pseudo-code, as actual LlamaIndex JS API may differ)
        let topMatches;
        if (jobs.length > 20) {
          // TODO: Implement LlamaIndex vector search for large job sets
          // For now, just slice jobs
          topMatches = jobs.slice(0, 20);
        } else {
          topMatches = jobs;
        }
        const resumeContext = `Resume:\n${resumeText}\n\nJobs:\n${JSON.stringify(topMatches)}`;
        const matchPrompt = `Given this resume and job list, return the top 3 job matches with reasons. Return JSON format.`;
        const response = await chat.call([
          { role: 'system', content: 'You are a job matching assistant.' },
          { role: 'user', content: `${resumeContext}\n\n${matchPrompt}` },
        ]);
        // Clean up temp file
        fs.unlinkSync(resumePath);
        resolve(NextResponse.json({ matches: response.text }));
      } catch (e) {
        resolve(NextResponse.json({ error: e.message }, { status: 500 }));
      }
    });
  });
} 