export enum Database {
  SCOPUS = 'Scopus',
  PUBMED = 'PubMed',
  CNKI = 'CNKI (知网)',
  WOS = 'Web of Science'
}

export interface SearchQueryResponse {
  query: string;
  explanation?: string;
}

export enum Step {
  DEFINE_DOMAIN = 1,
  SELECT_DB = 2,
  RESULT = 3
}

export enum ApiProvider {
  GOOGLE = 'Google Gemini',
  OPENAI = 'OpenAI Compatible'
}

export interface ApiSettings {
  provider: ApiProvider;
  apiKey: string;
  baseUrl?: string;
  modelName: string;
}