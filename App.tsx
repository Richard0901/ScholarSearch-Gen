import React, { useState } from 'react';
import { Database, Step } from './types';
import { identifyDomain, generateSearchString } from './services/geminiService';
import { DatabaseIcon, MagicWandIcon, SearchIcon, CopyIcon, CheckIcon, ArrowRightIcon, RefreshIcon } from './components/Icons';
import StepIndicator from './components/StepIndicator';

const App: React.FC = () => {
  // State
  const [currentStep, setCurrentStep] = useState<Step>(Step.DEFINE_DOMAIN);
  
  // Step 1: Domain
  const [inputMode, setInputMode] = useState<'auto' | 'manual'>('auto');
  const [researchDescription, setResearchDescription] = useState('');
  const [domain, setDomain] = useState('');
  const [isDomainLoading, setIsDomainLoading] = useState(false);
  const [domainError, setDomainError] = useState('');

  // Step 2: Database
  const [selectedDb, setSelectedDb] = useState<Database>(Database.SCOPUS);

  // Step 3: Result
  const [generatedQuery, setGeneratedQuery] = useState('');
  const [isQueryLoading, setIsQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState('');
  const [copied, setCopied] = useState(false);

  // Handlers
  const handleIdentifyDomain = async () => {
    if (!researchDescription.trim()) {
      setDomainError('请输入您的研究内容');
      return;
    }
    setDomainError('');
    setIsDomainLoading(true);
    try {
      const result = await identifyDomain(researchDescription);
      setDomain(result);
    } catch (e) {
      setDomainError('无法识别，请尝试手动输入');
    } finally {
      setIsDomainLoading(false);
    }
  };

  const handleGenerateQuery = async () => {
    if (!domain.trim()) {
      setDomainError('领域不能为空');
      return;
    }
    setQueryError('');
    setGeneratedQuery('');
    setCurrentStep(Step.RESULT);
    setIsQueryLoading(true);

    try {
      const query = await generateSearchString(domain, selectedDb);
      setGeneratedQuery(query);
    } catch (e) {
      setQueryError('生成检索式失败，请重试');
    } finally {
      setIsQueryLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedQuery) {
      navigator.clipboard.writeText(generatedQuery);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetApp = () => {
    setCurrentStep(Step.DEFINE_DOMAIN);
    setGeneratedQuery('');
    setCopied(false);
  };

  const getDbUrl = (db: Database) => {
    switch (db) {
      case Database.PUBMED: return "https://pubmed.ncbi.nlm.nih.gov/advanced/";
      case Database.SCOPUS: return "https://www.scopus.com/search/form.uri?display=advanced";
      case Database.CNKI: return "https://kns.cnki.net/kns8/AdvSearch";
      case Database.WOS: return "https://www.webofscience.com/wos/woscc/advanced-search";
      default: return "#";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8 text-gray-800">
      
      {/* Header */}
      <div className="max-w-3xl mx-auto text-center mb-10">
        <div className="flex justify-center mb-4">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200">
            <SearchIcon className="text-white w-8 h-8" />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
          学术检索生成器
        </h1>
        <p className="mt-3 text-lg text-gray-500">
          智能生成适用于 PubMed、Scopus、CNKI 和 Web of Science 的高级检索式。
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        <StepIndicator currentStep={currentStep} />
        
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          
          {/* Step 1: Define Domain */}
          <div className={`p-8 ${currentStep !== Step.DEFINE_DOMAIN && 'hidden'}`}>
             <h2 className="text-xl font-bold mb-6 flex items-center">
              <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 text-sm">1</span>
              确定研究领域
            </h2>

            {/* Toggle Input Mode */}
            <div className="flex bg-gray-100 p-1 rounded-lg mb-6 w-full sm:w-auto self-start inline-flex">
              <button
                onClick={() => setInputMode('auto')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  inputMode === 'auto' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                AI 智能提取
              </button>
              <button
                onClick={() => setInputMode('manual')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  inputMode === 'manual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                手动输入
              </button>
            </div>

            {inputMode === 'auto' ? (
              <div className="space-y-4">
                <div className="relative">
                  <textarea
                    value={researchDescription}
                    onChange={(e) => setResearchDescription(e.target.value)}
                    placeholder="例如：我正在研究关于老年人跌倒风险预测的人工智能模型..."
                    className="w-full h-32 p-4 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none bg-gray-50 text-gray-700"
                  />
                  {domainError && <p className="text-red-500 text-sm mt-2">{domainError}</p>}
                </div>
                
                <button
                  onClick={handleIdentifyDomain}
                  disabled={isDomainLoading}
                  className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isDomainLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      提取中...
                    </span>
                  ) : (
                    <span className="flex items-center">
                       <MagicWandIcon className="w-5 h-5 mr-2" />
                       提取大领域
                    </span>
                  )}
                </button>
              </div>
            ) : (
              <div>
                 <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="请输入研究领域（例如：锂离子电池硅负极）"
                  className="w-full p-4 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none bg-gray-50"
                 />
              </div>
            )}

            {/* Result of Extraction or Manual Input Display */}
            {(domain || inputMode === 'manual') && (
              <div className="mt-8 animate-fade-in-up">
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                    确认领域名称
                 </label>
                 <div className="flex gap-2">
                   <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="flex-1 p-3 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-300"
                   />
                 </div>
                 <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setCurrentStep(Step.SELECT_DB)}
                      disabled={!domain.trim()}
                      className="flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      下一步
                      <ArrowRightIcon className="w-4 h-4 ml-2" />
                    </button>
                 </div>
              </div>
            )}
          </div>

          {/* Step 2: Select Database */}
          <div className={`p-8 ${currentStep !== Step.SELECT_DB && 'hidden'}`}>
             <h2 className="text-xl font-bold mb-6 flex items-center">
              <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 text-sm">2</span>
              选择数据库
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {Object.values(Database).map((db) => (
                <button
                  key={db}
                  onClick={() => setSelectedDb(db)}
                  className={`relative p-6 rounded-xl border-2 text-left transition-all ${
                    selectedDb === db
                      ? 'border-indigo-600 bg-indigo-50 shadow-md'
                      : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between">
                     <div className="font-bold text-lg text-gray-800">{db}</div>
                     {selectedDb === db && <div className="bg-indigo-600 rounded-full p-1"><CheckIcon className="w-3 h-3 text-white"/></div>}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {db === Database.SCOPUS && "TITLE-ABS-KEY & AND NOT TITLE"}
                    {db === Database.PUBMED && "[Title/Abstract] & MeSH"}
                    {db === Database.CNKI && "SU=主题, | 或者, ! 非"}
                    {db === Database.WOS && "TS=主题, TI=标题"}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setCurrentStep(Step.DEFINE_DOMAIN)}
                className="text-gray-500 hover:text-gray-900 font-medium text-sm"
              >
                返回
              </button>
              <button
                onClick={handleGenerateQuery}
                className="flex items-center px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all transform hover:scale-105"
              >
                <MagicWandIcon className="w-5 h-5 mr-2" />
                生成高级检索式
              </button>
            </div>
          </div>

          {/* Step 3: Result */}
          <div className={`p-8 ${currentStep !== Step.RESULT && 'hidden'}`}>
             <h2 className="text-xl font-bold mb-6 flex items-center">
              <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 text-sm">3</span>
              生成结果
            </h2>

            {isQueryLoading ? (
               <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                  <p className="text-gray-500 animate-pulse">正在设计检索结构...</p>
               </div>
            ) : queryError ? (
               <div className="p-4 bg-red-50 text-red-600 rounded-lg text-center">
                 {queryError}
                 <button onClick={handleGenerateQuery} className="block mt-2 text-indigo-600 underline mx-auto">重试</button>
               </div>
            ) : (
              <div className="animate-fade-in-up">
                 <div className="bg-slate-900 rounded-xl p-6 relative group">
                    <div className="absolute top-4 right-4">
                      <button
                        onClick={copyToClipboard}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors backdrop-blur-sm"
                        title="复制到剪贴板"
                      >
                        {copied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
                      </button>
                    </div>
                    <div className="mb-2 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                      {selectedDb} 高级检索式
                    </div>
                    <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap break-words leading-relaxed">
                      {generatedQuery}
                    </pre>
                 </div>

                 <div className="mt-8 flex justify-center gap-4">
                    <button
                      onClick={resetApp}
                      className="flex items-center px-6 py-3 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <RefreshIcon className="w-4 h-4 mr-2" />
                      重新开始
                    </button>
                    <a 
                      href={getDbUrl(selectedDb)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md transition-colors"
                    >
                      前往 {selectedDb}
                      <ArrowRightIcon className="w-4 h-4 ml-2" />
                    </a>
                 </div>
              </div>
            )}
          </div>

        </div>
      </div>
      
      {/* Footer */}
      <footer className="mt-12 text-center text-gray-400 text-sm">
        <p>© {new Date().getFullYear()} 学术检索生成器 | 基于 Gemini API 构建</p>
      </footer>
    </div>
  );
};

export default App;