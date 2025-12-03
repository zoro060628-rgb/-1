import React, { useState, useMemo } from 'react';
import { 
  ZapIcon, 
  BookOpenIcon, 
  ActivityIcon, 
  CheckCircleIcon, 
  ArrowRightIcon, 
  PlusIcon, 
  TrashIcon,
  BrainIcon,
  SendIcon
} from './components/Icons';
import { generateActionPlan, evaluateStudyConcept, generateDailyRoutine } from './services/geminiService';
import { ActionStep, StudyFeedback, Task, Concept, Habit } from './types';

// === HELPER HOOK FOR LOCAL STORAGE ===
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

// === MAIN APP COMPONENT ===
const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'proactivity' | 'study' | 'rhythm'>('proactivity');
  
  // Data States
  const [tasks, setTasks] = useLocalStorage<Task[]>('pro_gro_tasks', []);
  const [concepts, setConcepts] = useLocalStorage<Concept[]>('pro_gro_concepts', []);
  const [habits, setHabits] = useLocalStorage<Habit[]>('pro_gro_habits', []);

  // === PROACTIVITY LOGIC ===
  const ProactivityTab = () => {
    const [newTask, setNewTask] = useState('');
    const [confirmReopenId, setConfirmReopenId] = useState<string | null>(null);
    const [isAiGenerating, setIsAiGenerating] = useState(false);
    const [aiSteps, setAiSteps] = useState<ActionStep[]>([]);
    const [showAiResults, setShowAiResults] = useState(false);

    const incompleteTasks = tasks.filter(t => !t.isComplete).sort((a, b) => b.createdAt - a.createdAt);
    const completedTasks = tasks.filter(t => t.isComplete).sort((a, b) => b.createdAt - a.createdAt);

    const handleAddTask = (text: string) => {
      const task: Task = {
        id: Date.now().toString() + Math.random(),
        text: text.trim(),
        isComplete: false,
        isProactiveDone: false,
        createdAt: Date.now()
      };
      setTasks(prev => [task, ...prev]);
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (newTask.trim()) {
        handleAddTask(newTask);
        setNewTask('');
      }
    };

    const handleAiBreakdown = async () => {
        if (!newTask.trim()) return;
        setIsAiGenerating(true);
        setShowAiResults(true);
        try {
            const steps = await generateActionPlan(newTask);
            setAiSteps(steps);
        } catch (e) {
            console.error(e);
            alert("AI 계획 생성 중 오류가 발생했습니다.");
        } finally {
            setIsAiGenerating(false);
        }
    };

    const addAiStepToTasks = (stepTitle: string) => {
        handleAddTask(stepTitle);
    };

    const addAllAiSteps = () => {
        aiSteps.forEach(step => handleAddTask(step.title));
        setAiSteps([]);
        setShowAiResults(false);
        setNewTask('');
    };

    const toggleProactiveStatus = (taskId: string) => {
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, isProactiveDone: !t.isProactiveDone } : t
      ));
    };

    const completeTask = (taskId: string) => {
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, isComplete: true } : t
      ));
    };

    const reopenTask = (taskId: string) => {
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, isComplete: false, isProactiveDone: false } : t
      ));
    };

    const deleteTask = (taskId: string) => {
      setTasks(prev => prev.filter(t => t.id !== taskId));
    };

    return (
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-100 border-b border-gray-700 pb-2 flex items-center gap-2">
            <ZapIcon className="text-yellow-400" /> 적극성 향상 훈련 (5분 실행)
        </h2>
        <p className="text-yellow-200 bg-yellow-900/40 p-3 rounded-lg border border-yellow-700/50">
          **5분 실행 규칙:** 너무 어려워 보이는 일도 일단 5분 동안만 시작하면 적극성을 높일 수 있습니다. '5분 실행하기' 버튼을 누르고, 실제로 5분만 해보세요!
        </p>

        <div className="flex flex-col gap-3">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="해야 할 일 (미루고 있는 일)을 입력하세요."
                    className="flex-1 p-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition bg-gray-900 text-gray-100 placeholder-gray-500"
                />
                <button 
                    onClick={handleSubmit}
                    disabled={!newTask.trim()}
                    className="bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-500 transition flex items-center font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <PlusIcon className="w-5 h-5 mr-1" /> 추가
                </button>
            </div>
            
            {/* AI Helper Button */}
            <button
                type="button"
                onClick={handleAiBreakdown}
                disabled={!newTask.trim() || isAiGenerating}
                className="self-start text-xs flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition px-2 py-1 rounded"
            >
                {isAiGenerating ? (
                    <span className="animate-pulse">AI가 분석 중입니다...</span>
                ) : (
                    <>
                        <BrainIcon className="w-4 h-4" />
                        AI에게 이 목표를 세분화해달라고 요청하기
                    </>
                )}
            </button>

            {/* AI Results Area */}
            {showAiResults && aiSteps.length > 0 && (
                <div className="bg-gray-800/80 border border-indigo-500/30 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="text-indigo-300 font-semibold text-sm">AI 추천 단계</h4>
                        <div className="flex gap-2">
                            <button onClick={addAllAiSteps} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-500">모두 추가</button>
                            <button onClick={() => setShowAiResults(false)} className="text-xs bg-gray-700 text-white px-2 py-1 rounded hover:bg-gray-600">닫기</button>
                        </div>
                    </div>
                    <ul className="space-y-2">
                        {aiSteps.map((step) => (
                            <li key={step.stepNumber} className="flex justify-between items-center bg-gray-900/50 p-2 rounded text-sm text-gray-300 border border-gray-700/50">
                                <span>{step.stepNumber}. {step.title} <span className='text-gray-500 text-xs'>({step.estimatedTime})</span></span>
                                <button onClick={() => addAiStepToTasks(step.title)} className="text-xs text-indigo-400 hover:text-white px-2">추가</button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>

        <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700/50">
          <h3 className="p-4 bg-gray-700/50 font-semibold text-gray-100 border-b border-gray-700 flex justify-between items-center">
             <span>미완료 과제</span>
             <span className="text-xs bg-gray-600 px-2 py-1 rounded-full">{incompleteTasks.length}</span>
          </h3>
          {incompleteTasks.length > 0 ? (
            <div>
                {incompleteTasks.map(task => (
                    <div key={task.id} className="flex items-center justify-between p-3 border-b border-gray-700/50 last:border-b-0 hover:bg-gray-700/30 transition duration-150">
                        <span className="flex-1 text-gray-100 font-medium">
                            {task.text}
                        </span>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => toggleProactiveStatus(task.id)}
                                className={`px-3 py-1 text-xs font-bold rounded-full transition duration-200 border 
                                    ${task.isProactiveDone 
                                        ? 'bg-green-600/20 text-green-400 border-green-600/50 hover:bg-green-600/30' 
                                        : 'bg-indigo-900/30 text-indigo-300 border-indigo-500/30 hover:bg-indigo-900/50'}`}
                            >
                                {task.isProactiveDone ? '5분 실행 완료' : '5분 실행하기'}
                            </button>
                            <button
                                onClick={() => completeTask(task.id)}
                                className="p-1.5 rounded-full text-green-500 hover:bg-green-900/30 transition duration-150"
                                title="완료"
                            >
                                <CheckCircleIcon className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => deleteTask(task.id)}
                                className="p-1.5 rounded-full text-gray-500 hover:text-red-400 hover:bg-red-900/30 transition duration-150"
                                title="삭제"
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                <CheckCircleIcon className="w-12 h-12 mb-3 opacity-20" />
                <p>미루고 있는 일이 없습니다! 👍</p>
            </div>
          )}
        </div>

        {completedTasks.length > 0 && (
            <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden opacity-80 border border-gray-700/50">
                <h3 className="p-4 bg-gray-700/50 font-semibold text-gray-100 border-b border-gray-700">
                    완료된 과제 ({completedTasks.length})
                </h3>
                {completedTasks.map(task => (
                    <div 
                        key={task.id}
                        className={`flex items-center justify-between p-3 border-b border-gray-700/50 last:border-b-0 transition duration-150 
                            ${confirmReopenId === task.id ? 'bg-indigo-900/20 border-l-4 border-l-indigo-500' : 'hover:bg-gray-700/30'}`}
                    >
                        <span 
                            className="flex-1 line-through text-gray-500 cursor-pointer select-none" 
                            onClick={() => setConfirmReopenId(task.id)}
                        >
                            {task.text}
                        </span>
                        
                        {confirmReopenId === task.id ? (
                            <div className="flex items-center space-x-2 ml-4 animate-fade-in">
                                <span className="text-xs text-indigo-300 hidden sm:inline">미완료로 되돌릴까요?</span>
                                <button
                                    onClick={() => {
                                        reopenTask(task.id);
                                        setConfirmReopenId(null);
                                    }}
                                    className="px-3 py-1 text-xs font-bold rounded bg-indigo-600 text-white hover:bg-indigo-500"
                                >
                                    Yes
                                </button>
                                <button
                                    onClick={() => setConfirmReopenId(null)}
                                    className="px-3 py-1 text-xs font-bold rounded bg-gray-600 text-gray-200 hover:bg-gray-500"
                                >
                                    No
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => deleteTask(task.id)}
                                className="p-1.5 rounded-full text-gray-600 hover:text-red-400 hover:bg-red-900/30 transition duration-150"
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        )}
      </div>
    );
  };

  // === STUDY LOGIC ===
  const StudyTab = () => {
    const [topic, setTopic] = useState('');
    const [confidence, setConfidence] = useState(7);
    const [explanation, setExplanation] = useState('');
    const [showAiTutor, setShowAiTutor] = useState(false);
    const [aiFeedback, setAiFeedback] = useState<StudyFeedback | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const scoreColors = useMemo(() => [
        'bg-red-600', 'bg-red-500', 'bg-orange-500', 'bg-orange-400',
        'bg-yellow-500', 'bg-yellow-400', 'bg-green-500', 'bg-green-600',
        'bg-green-700', 'bg-emerald-600'
    ], []);

    const handleAddConcept = (e: React.FormEvent) => {
      e.preventDefault();
      if (topic.trim()) {
        const newConcept: Concept = {
            id: Date.now().toString(),
            topic: topic.trim(),
            confidenceScore: confidence,
            createdAt: Date.now(),
            aiFeedback: aiFeedback ? aiFeedback.encouragement : undefined
        };
        setConcepts(prev => [newConcept, ...prev]);
        setTopic('');
        setConfidence(7);
        setExplanation('');
        setAiFeedback(null);
        setShowAiTutor(false);
      }
    };

    const deleteConcept = (id: string) => {
        setConcepts(prev => prev.filter(c => c.id !== id));
    };

    const handleAiCheck = async () => {
        if (!topic.trim() || !explanation.trim()) return;
        setIsLoading(true);
        try {
            const feedback = await evaluateStudyConcept(topic, explanation);
            setAiFeedback(feedback);
            setConfidence(Math.round(feedback.score / 10)); // Convert 100 scale to 10 scale
        } catch (e) {
            console.error(e);
            alert("AI 분석 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-100 border-b border-gray-700 pb-2 flex items-center gap-2">
            <BookOpenIcon className="text-blue-400" /> 공부/이해 효율 강화 (메타 인지 훈련)
        </h2>
        <p className="text-blue-200 bg-blue-900/40 p-3 rounded-lg border border-blue-700/50">
          **메타 인지 훈련:** 공부한 개념을 기록하고, 스스로 이해도를 점수(1~10점)로 평가해보세요. '나의 이해도'와 '실제 이해도'의 격차를 줄이는 것이 학습 효율의 핵심입니다.
        </p>

        <div className="bg-gray-800 p-5 rounded-xl shadow-xl border border-gray-700/50 space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-200">새로운 개념 기록</h3>
                <button 
                    type="button" 
                    onClick={() => setShowAiTutor(!showAiTutor)}
                    className="text-xs flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition"
                >
                    <BrainIcon className="w-4 h-4" />
                    {showAiTutor ? "AI 튜터 닫기" : "AI 튜터에게 설명해보기"}
                </button>
            </div>
            
            {showAiTutor && (
                <div className="bg-gray-900/50 p-4 rounded-lg border border-emerald-500/30 space-y-3">
                    <p className="text-sm text-gray-400">주제에 대해 설명하면 AI가 이해도를 점검해줍니다.</p>
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="주제 입력 (예: React Hooks)"
                        className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-gray-200 text-sm focus:border-emerald-500"
                    />
                    <textarea
                        value={explanation}
                        onChange={(e) => setExplanation(e.target.value)}
                        placeholder="이 개념을 설명해보세요..."
                        className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-gray-200 text-sm h-24 focus:border-emerald-500"
                    />
                    <button
                        onClick={handleAiCheck}
                        disabled={isLoading || !explanation.trim()}
                        className="w-full py-2 bg-emerald-600 text-white rounded hover:bg-emerald-500 text-sm font-bold flex justify-center items-center gap-2"
                    >
                        {isLoading ? <span className="animate-spin">⌛</span> : "AI 이해도 점검 받기"}
                    </button>
                    {aiFeedback && (
                        <div className="mt-2 text-sm text-gray-300 bg-gray-800 p-3 rounded border border-gray-700">
                            <p className="font-bold text-emerald-400 mb-1">점수: {aiFeedback.score}점</p>
                            <p className="mb-2">{aiFeedback.encouragement}</p>
                            <p className="text-xs text-gray-500 italic">"점수" 슬라이더가 AI 평가에 맞춰 자동 조정되었습니다.</p>
                        </div>
                    )}
                </div>
            )}

            <form onSubmit={handleAddConcept} className="space-y-4">
                {!showAiTutor && (
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="개념/주제 (예: RNN의 동작 원리)"
                        className="w-full p-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-900 text-gray-100 placeholder-gray-500"
                        required
                    />
                )}
                <div className="flex items-center space-x-4">
                    <label className="text-gray-200 font-medium whitespace-nowrap text-sm">자신감 (1~10):</label>
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={confidence}
                        onChange={(e) => setConfidence(Number(e.target.value))}
                        className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <span className={`text-xl font-bold w-8 text-center ${confidence >= 8 ? 'text-green-400' : confidence >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {confidence}
                    </span>
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-500 transition flex items-center justify-center font-bold">
                    <BookOpenIcon className="w-5 h-5 mr-1" /> 기록 저장
                </button>
            </form>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700/50">
            <h3 className="p-4 bg-gray-700/50 font-semibold text-gray-100 border-b border-gray-700">기록된 개념 ({concepts.length})</h3>
            {concepts.length > 0 ? (
                <div>
                    {concepts.map(concept => (
                        <div key={concept.id} className="flex items-center justify-between p-3 border-b border-gray-700/50 last:border-b-0 hover:bg-gray-700/30 transition duration-150">
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-100 truncate">{concept.topic}</p>
                                <p className="text-xs text-gray-500">
                                    {new Date(concept.createdAt).toLocaleDateString()} 
                                    {concept.aiFeedback && " • AI 인증됨"}
                                </p>
                            </div>
                            <div className="flex items-center space-x-3 ml-4">
                                <span className={`px-3 py-1 text-sm font-bold text-white rounded-full ${scoreColors[concept.confidenceScore - 1] || 'bg-gray-600'}`}>
                                    {concept.confidenceScore}점
                                </span>
                                <button
                                    onClick={() => deleteConcept(concept.id)}
                                    className="p-1.5 rounded-full text-gray-600 hover:text-red-400 hover:bg-red-900/30 transition duration-150"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="p-8 text-center text-gray-500">기록된 개념이 없습니다.</p>
            )}
        </div>
      </div>
    );
  };

  // === RHYTHM LOGIC ===
  const RhythmTab = () => {
    const [newHabitName, setNewHabitName] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const today = new Date().toISOString().split('T')[0];

    const handleAddHabit = (name: string) => {
        const habit: Habit = {
            id: Date.now().toString() + Math.random(),
            name: name.trim(),
            lastCompletedDate: null,
            streak: 0,
            createdAt: Date.now()
        };
        setHabits(prev => [habit, ...prev]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newHabitName.trim()) {
            handleAddHabit(newHabitName);
            setNewHabitName('');
        }
    };

    const handleGenerateRoutine = async () => {
        setIsGenerating(true);
        try {
            // Hardcoded time params for quick demo, but in real world could be inputs
            const plan = await generateDailyRoutine("07:00", "23:00", ["공부", "운동"]);
            plan.items.slice(0, 3).forEach(item => {
                handleAddHabit(`${item.time} ${item.activity}`);
            });
            alert("AI가 추천한 루틴이 추가되었습니다!");
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    const completeHabit = (id: string) => {
        setHabits(prev => prev.map(habit => {
            if (habit.id === id) {
                const isToday = habit.lastCompletedDate === today;
                if (isToday) return habit;
                return {
                    ...habit,
                    lastCompletedDate: today,
                    streak: habit.streak + 1
                };
            }
            return habit;
        }));
    };

    const deleteHabit = (id: string) => {
        setHabits(prev => prev.filter(h => h.id !== id));
    };

    const isTodayCompleted = (habit: Habit) => habit.lastCompletedDate === today;

    return (
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-100 border-b border-gray-700 pb-2 flex items-center gap-2">
            <ActivityIcon className="text-pink-400" /> 생활/운동 리듬 개선 강습 (습관 체인)
        </h2>
        <p className="text-pink-200 bg-pink-900/40 p-3 rounded-lg border border-pink-700/50">
          **습관 체인:** 매일 실천할 핵심 습관을 설정하고, 연속 기록(Streak)을 깨지 않도록 관리합니다. 이제 습관 항목을 클릭하여 기록을 직접 누적하세요!
        </p>

        <div className="flex flex-col gap-2">
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    placeholder="추가할 습관 (예: 7시 기상, 30분 운동)"
                    className="flex-1 p-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-900 text-gray-100 placeholder-gray-500"
                />
                <button type="submit" className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-500 transition flex items-center font-medium">
                    <PlusIcon className="w-5 h-5 mr-1" /> 추가
                </button>
            </form>
            
            <button 
                onClick={handleGenerateRoutine}
                disabled={isGenerating}
                className="text-xs text-pink-400 hover:text-pink-300 flex items-center gap-1 ml-1 self-start px-2 py-1 rounded hover:bg-gray-800 transition"
            >
                <BrainIcon className="w-4 h-4" /> 
                {isGenerating ? "루틴 생성 중..." : "AI에게 간단한 루틴 추천받기"}
            </button>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700/50">
            <h3 className="p-4 bg-gray-700/50 font-semibold text-gray-100 border-b border-gray-700 flex justify-between items-center">
                <span>오늘의 습관</span>
                <span className="text-xs text-gray-400">{habits.filter(isTodayCompleted).length} / {habits.length} 완료</span>
            </h3>
            {habits.length > 0 ? (
                <div>
                    {habits.map(habit => {
                        const completed = isTodayCompleted(habit);
                        return (
                            <div 
                                key={habit.id}
                                className={`flex items-center justify-between p-3 border-b border-gray-700/50 last:border-b-0 transition duration-150 cursor-pointer select-none
                                    ${completed ? 'bg-gray-700/30' : 'hover:bg-gray-700/30'}`}
                                onClick={() => !completed && completeHabit(habit.id)}
                            >
                                <div className="flex items-center space-x-3 flex-1">
                                    <button
                                        disabled={completed}
                                        className={`p-2 rounded-full transition duration-200 ${completed ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-indigo-600 hover:text-white'}`}
                                    >
                                        {completed ? <CheckCircleIcon className="w-5 h-5" /> : <ActivityIcon className="w-5 h-5" />}
                                    </button>
                                    <span className={`font-medium text-gray-100 ${completed ? 'line-through text-gray-500' : ''}`}>
                                        {habit.name}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-3 ml-4">
                                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${habit.streak > 0 ? 'bg-pink-900/40 text-pink-300 border border-pink-700/50' : 'bg-gray-700 text-gray-400'}`}>
                                        {habit.streak}일 연속
                                    </span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteHabit(habit.id); }}
                                        className="p-1.5 rounded-full text-gray-600 hover:text-red-400 hover:bg-red-900/30"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="p-8 text-center text-gray-500">아직 습관이 없습니다. 새로운 습관을 추가해 보세요!</p>
            )}
        </div>
      </div>
    );
  };

  // === RENDER ===
  return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-8 font-sans text-gray-100">
      <style>{`
        input[type=range] { -webkit-appearance: none; background: transparent; }
        input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            height: 20px; width: 20px;
            border-radius: 50%;
            background: #6366f1;
            cursor: pointer;
            margin-top: -6px;
        }
        input[type=range]::-webkit-slider-runnable-track {
            width: 100%; height: 8px;
            cursor: pointer; background: #374151;
            border-radius: 4px;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
      
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-8">
            <h1 className="text-4xl font-extrabold text-indigo-400 mb-2 flex items-center justify-center gap-3">
                <ZapIcon className="w-10 h-10" /> Pro-Gro: 적극적 성장 코치
            </h1>
            <p className="text-gray-400 mb-4">적극성, 학습 효율, 생활 리듬 개선을 위한 통합 앱</p>
            <div className="inline-block bg-gray-800 border border-gray-700 px-4 py-2 rounded-lg text-sm text-gray-300">
                **현재 사용자:** <span className="font-semibold text-indigo-400">20253703 조해솔</span>
            </div>
        </header>

        <nav className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 p-2 bg-gray-800 rounded-xl shadow-lg mb-8 border border-gray-700">
            <button
                onClick={() => setActiveTab('proactivity')}
                className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg text-sm font-bold transition-all duration-200
                    ${activeTab === 'proactivity' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}
            >
                <ArrowRightIcon className="w-4 h-4 mr-2" /> 1. 적극성 (5분 실행)
            </button>
            <button
                onClick={() => setActiveTab('study')}
                className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg text-sm font-bold transition-all duration-200
                    ${activeTab === 'study' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}
            >
                <BookOpenIcon className="w-4 h-4 mr-2" /> 2. 학습 효율 (이해도)
            </button>
            <button
                onClick={() => setActiveTab('rhythm')}
                className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg text-sm font-bold transition-all duration-200
                    ${activeTab === 'rhythm' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}
            >
                <ActivityIcon className="w-4 h-4 mr-2" /> 3. 생활 리듬 (습관)
            </button>
        </nav>

        <main className="p-6 bg-gray-800/50 border border-gray-700 rounded-2xl shadow-2xl backdrop-blur-sm min-h-[400px]">
            {activeTab === 'proactivity' && <ProactivityTab />}
            {activeTab === 'study' && <StudyTab />}
            {activeTab === 'rhythm' && <RhythmTab />}
        </main>

        <footer className="mt-8 text-center text-xs text-gray-600 pb-8">
            <p>인공지능(12421) 과제 제출용 앱 | LocalStorage 기반 데이터 관리 | Powered by Google Gemini</p>
        </footer>
      </div>
    </div>
  );
};

export default App;