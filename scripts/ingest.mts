import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

console.log('OPENAI_API_KEY set:', !!process.env.OPENAI_API_KEY);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseKey);

const openaiApiKey = process.env.OPENAI_API_KEY!;
if (!openaiApiKey.startsWith('sk-')) {
  throw new Error('Invalid OpenAI API Key.');
}
const openai = new OpenAI({ apiKey: openaiApiKey });

interface HadithRecord {
  id: string;
  hadith_id: string;
  source: string;
  chapter_no: string;
  hadith_no: string;
  chapter: string;
  chain_indx: string;
  text_ar: string;
  text_en: string;
}

async function ingest() {
  const START_LINE = 14927;
  console.log('Starting ingestion from CSV line >=', START_LINE);

  const filePath = path.resolve(process.cwd(), 'data/hadiths.csv');
  const stream = fs.createReadStream(filePath).pipe(csv());

  const batchSize = 50;
  let batch: HadithRecord[] = [];
  let currentLine = 0;

  for await (const record of stream as AsyncIterable<HadithRecord>) {
    currentLine++;

    if (currentLine < START_LINE) continue; // Skip until reaching START_LINE

    batch.push(record);

    if (batch.length >= batchSize) {
      await processBatch(batch);
      batch = [];
    }
  }

  // Process any remaining records
  if (batch.length > 0) {
    await processBatch(batch);
  }

  console.log('Ingestion complete');
}

async function processBatch(records: HadithRecord[]) {
  try {
    const startNo = records[0]?.hadith_no || '?';
    const endNo = records[records.length - 1]?.hadith_no || '?';
    console.log(`Processing batch hadiths ${startNo}–${endNo}`);

    /*
    // De-duplicate: check existing hadith_id
    const hadithIds = records.map(r => r.hadith_id);
    const { data: existing, error: selectError } = await supabase
      .from('hadiths')
      .select('hadith_id')
      .in('hadith_id', hadithIds);

    if (selectError) {
      console.error('Error checking duplicates:', selectError.message);
    }

    const existingSet = new Set(existing?.map(e => e.hadith_id) || []);
    const filteredRecords = records.filter(r => !existingSet.has(r.hadith_id));

    if (filteredRecords.length === 0) {
      console.log(`No new records in ${startNo}–${endNo}, skipping`);
      return;
    }

    const inputs = filteredRecords.map(r => r.text_en);
    */

    const inputs = records.map(r => r.text_en); // <-- process all records without filtering

    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: inputs,
    });

    const embeddings = response.data.map(d => d.embedding);

    const insertPayload = records.map((record, idx) => ({
      hadith_id: record.hadith_id,
      source: record.source,
      chapter_no: parseInt(record.chapter_no),
      hadith_no: parseInt(record.hadith_no),
      chapter: record.chapter,
      chain_indx: record.chain_indx,
      text_ar: record.text_ar,
      text_en: record.text_en,
      embedding: embeddings[idx],
    }));

    const { error } = await supabase.from('hadiths').insert(insertPayload);

    if (error) {
      console.error(`Batch insert error for hadiths ${startNo}–${endNo}:`, error.message);
    } else {
      console.log(`Inserted hadiths ${startNo}–${endNo} (${records.length} records)`);
    }
  } catch (err) {
    console.error('Error processing batch:', err);
  }
}

ingest().catch(console.error);
