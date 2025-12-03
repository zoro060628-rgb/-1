import React, { useState } from 'react';
import { BookOpenIcon, BrainIcon, SendIcon, RefreshIcon } from './Icons';
import { evaluateStudyConcept } from '../services/geminiService';
import { StudyFeedback } from '../types';

const StudyView: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [explanation, setExplanation] = useState('');
  const [feedback, setFeedback] = useState<StudyFeedback | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !explanation.trim()) return;

    setIsLoading(true);
    setError(null);
    setFeedback(null);

    try {
      const result = await evaluateStudyConcept(topic, explanation);
      setFeedback(result);
    } catch (err) {
      setError('학습 내용을 분석하는 데 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFeedback(null);
    setTopic('');
    setExplanation('');
  };

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      {/* Input Section */}
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpenIcon className="text-emerald-600" />
            파인만 학습법 튜터
          </h2>
          <p className="text-slate-600 text-sm">
            공부한 내용을 자신의 말로 설명해보세요. AI 튜터가 이해도를 점검하고 부족한 부분을 채워줍니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">학습 주제 (개념)</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="예: 상대성 이론, 리액트의 useEffect, 광합성"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">내가 이해한 내용 설명하기</label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="이 주제에 대해 아는 만큼 최대한 자세하고 쉽게 설명해보세요..."
              rows={8}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !topic.trim() || !explanation.trim()}
            className="w-full py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:bg-slate-300 transition-colors font-medium flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                검사 받기 <SendIcon className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>

      {/* Output Section */}
      <div className="relative">
        {!feedback && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
            <BrainIcon className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">설명을 입력하면 피드백이 나타납니다.</p>
          </div>
        )}

        {isLoading && (
           <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10 rounded-3xl">
             <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4" />
             <p className="text-emerald-800 font-medium animate-pulse">AI 튜터가 분석 중입니다...</p>
           </div>
        )}

        {feedback && (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 h-full flex flex-col animate-fade-in">
            <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">📊 분석 결과</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                  {feedback.score}점 / 100점
                </span>
                <button 
                  onClick={handleReset}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                  title="다시 하기"
                >
                  <RefreshIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
              <div>
                <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <span className="w-2 h-8 bg-emerald-500 rounded-full"></span>
                  이해도 수준
                </h4>
                <p className="text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {feedback.understandingLevel}
                </p>
              </div>

              {feedback.missingConcepts.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <span className="w-2 h-8 bg-amber-500 rounded-full"></span>
                    놓친 핵심 개념
                  </h4>
                  <ul className="space-y-2">
                    {feedback.missingConcepts.map((concept, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                        <span className="text-amber-500 mt-1">•</span>
                        {concept}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
                  파인만 기법 재설명
                </h4>
                <div className="prose prose-slate bg-blue-50 p-5 rounded-xl border border-blue-100 text-slate-700">
                  {feedback.betterExplanation}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <span className="w-2 h-8 bg-rose-500 rounded-full"></span>
                  튜터의 한마디
                </h4>
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 text-rose-800 italic">
                  "{feedback.encouragement}"
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyView;