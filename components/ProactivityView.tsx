import React, { useState } from 'react';
import { TargetIcon, SendIcon, CheckCircleIcon } from './Icons';
import { generateActionPlan } from '../services/geminiService';
import { ActionStep } from '../types';

const ProactivityView: React.FC = () => {
  const [goal, setGoal] = useState('');
  const [steps, setSteps] = useState<ActionStep[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;

    setIsLoading(true);
    setError(null);
    setSteps([]);
    
    try {
      const result = await generateActionPlan(goal);
      setSteps(result);
    } catch (err) {
      setError('목표를 분석하는 중 문제가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStep = (stepNumber: number) => {
    setSteps(prev => prev.map(step => 
      step.stepNumber === stepNumber ? { ...step, isCompleted: !step.isCompleted } : step
    ));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-800 flex items-center justify-center gap-2">
          <TargetIcon className="text-blue-600" />
          적극적 목표 설정
        </h2>
        <p className="text-slate-600">
          막연한 목표를 입력하세요. AI가 실행 가능한 구체적인 단계로 나누어 드립니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="예: '올해 안에 마라톤 완주하기', '스페인어 기초 떼기'"
          className="w-full px-6 py-4 text-lg border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:outline-none shadow-sm transition-all"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !goal.trim()}
          className="absolute right-2 top-2 bottom-2 px-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              분석하기 <SendIcon className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      {steps.length > 0 && (
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 animate-fade-in">
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-100">
            <h3 className="text-xl font-bold text-slate-800">🚀 '{goal}' 달성 로드맵</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {steps.map((step) => (
              <div 
                key={step.stepNumber} 
                className={`p-6 transition-all hover:bg-slate-50 cursor-pointer group ${step.isCompleted ? 'bg-slate-50 opacity-70' : ''}`}
                onClick={() => toggleStep(step.stepNumber)}
              >
                <div className="flex items-start gap-4">
                  <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    step.isCompleted ? 'bg-green-500 text-white' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {step.isCompleted ? <CheckCircleIcon className="w-5 h-5" /> : <span className="font-bold">{step.stepNumber}</span>}
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-lg font-bold mb-1 ${step.isCompleted ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                      {step.title}
                    </h4>
                    <p className="text-slate-600 text-sm mb-2">{step.description}</p>
                    <span className="inline-block px-3 py-1 bg-slate-100 text-slate-500 text-xs rounded-full">
                      ⏱ {step.estimatedTime}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 bg-slate-50 text-center">
            <p className="text-slate-500 text-sm">각 단계를 클릭하여 완료 표시를 할 수 있습니다.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProactivityView;
