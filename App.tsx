import React, { useState, useMemo } from 'react';
import { 
  ZapIcon, 
  BookOpenIcon, 
  ActivityIcon, 
  CheckCircleIcon, 
  ArrowRightIcon, 
  PlusIcon, 
  TrashIcon
} from './components/Icons';
import { Task, Concept, Habit } from './types';

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
      <div className="space-y-6 pb-4 animate-fade-in">
        <div className="bg-yellow-900/30 p-4 rounded-2xl border border-yellow-700/30">
          <h3 className="text-yellow-400 font-bold mb-1 flex items-center gap-2">
            <ZapIcon className="w-5 h-5" /> 5분 실행 규칙
          </h3>
          <p className="text-yellow-200/80 text-sm leading-relaxed">
            하기 싫은 일도 딱 5분만 해보세요. 일단 시작하면 뇌는 계속하고 싶어합니다.
          </p>
        </div>

        <div className="flex flex-col gap-3">
            <div className="relative">
                <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="미루고 있는 일 입력..."
                    className="w-full p-4 pr-14 border border-gray-700 rounded-2xl bg-gray-800 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm"
                />
                <button 
                    onClick={handleSubmit}
                    disabled={!newTask.trim()}
                    className="absolute right-2 top-2 bottom-2 bg-indigo-600 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-indigo-500 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                >
                    <PlusIcon className="w-6 h-6" />
                </button>
            </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider ml-1">할 일 목록 ({incompleteTasks.length})</h3>
          {incompleteTasks.length > 0 ? (
            <div className="space-y-3">
                {incompleteTasks.map(task => (
                    <div key={task.id} className="bg-gray-800 p-4 rounded-2xl border border-gray-700 shadow-sm flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                             <span className="text-gray-100 font-medium text-lg leading-snug break-all">
                                {task.text}
                            </span>
                             <button
                                onClick={() => deleteTask(task.id)}
                                className="text-gray-600 p-1 -mr-2 -mt-2 active:scale-90 transition"
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                       
                        <div className="flex items-center gap-2 pt-1">
                            <button
                                onClick={() => toggleProactiveStatus(task.id)}
                                className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-bold transition-all active:scale-95 flex justify-center items-center gap-2 border
                                    ${task.isProactiveDone 
                                        ? 'bg-green-500/10 text-green-400 border-green-500/30' 
                                        : 'bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-900/50'}`}
                            >
                                {task.isProactiveDone ? <CheckCircleIcon className="w-4 h-4"/> : <ZapIcon className="w-4 h-4" />}
                                {task.isProactiveDone ? '5분 완료됨' : '5분 시작'}
                            </button>
                            <button
                                onClick={() => completeTask(task.id)}
                                className="w-12 h-11 flex items-center justify-center rounded-xl bg-gray-700 text-gray-300 active:bg-green-600 active:text-white transition-colors active:scale-95"
                                title="완료"
                            >
                                <CheckCircleIcon className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500 flex flex-col items-center bg-gray-800/30 rounded-2xl border border-gray-800 border-dashed">
                <CheckCircleIcon className="w-12 h-12 mb-3 opacity-20" />
                <p>할 일이 없습니다.<br/>편안한 하루 되세요!</p>
            </div>
          )}
        </div>

        {completedTasks.length > 0 && (
            <div className="space-y-2 opacity-80 pt-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-1">완료됨 ({completedTasks.length})</h3>
                <div className="space-y-2">
                {completedTasks.map(task => (
                    <div 
                        key={task.id}
                        onClick={() => setConfirmReopenId(confirmReopenId === task.id ? null : task.id)}
                        className={`p-4 rounded-xl border transition-all duration-200
                            ${confirmReopenId === task.id 
                                ? 'bg-indigo-900/20 border-indigo-500/50' 
                                : 'bg-gray-800/50 border-gray-800'}`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="flex-1 line-through text-gray-500 select-none text-sm">
                                {task.text}
                            </span>
                            {confirmReopenId === task.id ? (
                                <div className="flex items-center gap-2 ml-3">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            reopenTask(task.id);
                                            setConfirmReopenId(null);
                                        }}
                                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-600 text-white"
                                    >
                                        복구
                                    </button>
                                </div>
                            ) : (
                                <TrashIcon className="w-4 h-4 text-gray-700" />
                            )}
                        </div>
                    </div>
                ))}
                </div>
            </div>
        )}
      </div>
    );
  };

  // === STUDY LOGIC ===
  const StudyTab = () => {
    const [topic, setTopic] = useState('');
    const [confidence, setConfidence] = useState(7);
    
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
            createdAt: Date.now()
        };
        setConcepts(prev => [newConcept, ...prev]);
        setTopic('');
        setConfidence(7);
      }
    };

    const deleteConcept = (id: string) => {
        setConcepts(prev => prev.filter(c => c.id !== id));
    };

    return (
      <div className="space-y-6 pb-4 animate-fade-in">
        <div className="bg-blue-900/30 p-4 rounded-2xl border border-blue-700/30">
          <h3 className="text-blue-400 font-bold mb-1 flex items-center gap-2">
            <BookOpenIcon className="w-5 h-5" /> 메타 인지 훈련
          </h3>
          <p className="text-blue-200/80 text-sm leading-relaxed">
            아는 것과 안다고 착각하는 것을 구분하세요. 스스로 점수를 매겨보는 것이 시작입니다.
          </p>
        </div>

        <div className="bg-gray-800 p-5 rounded-2xl shadow-lg border border-gray-700 space-y-5">
            <h3 className="text-lg font-bold text-gray-100">오늘 배운 내용 기록</h3>
            <form onSubmit={handleAddConcept} className="space-y-5">
                <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="공부한 주제 입력..."
                    className="w-full p-4 border border-gray-700 rounded-xl bg-gray-900 text-gray-100 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                />
                <div className="space-y-2">
                    <div className="flex justify-between items-end px-1">
                        <label className="text-gray-400 text-sm font-medium">이해도 자가 진단</label>
                        <span className={`text-2xl font-bold ${confidence >= 8 ? 'text-green-400' : confidence >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {confidence}<span className="text-sm text-gray-500 font-normal">/10</span>
                        </span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={confidence}
                        onChange={(e) => setConfidence(Number(e.target.value))}
                        className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <div className="flex justify-between text-xs text-gray-600 px-1">
                        <span>모름</span>
                        <span>완벽함</span>
                    </div>
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white p-4 rounded-xl shadow-lg shadow-indigo-900/50 hover:bg-indigo-500 active:scale-95 transition flex items-center justify-center font-bold text-lg">
                    <PlusIcon className="w-5 h-5 mr-2" /> 기록하기
                </button>
            </form>
        </div>

        <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider ml-1">기록 ({concepts.length})</h3>
            {concepts.length > 0 ? (
                <div className="space-y-3">
                    {concepts.map(concept => (
                        <div key={concept.id} className="bg-gray-800 p-4 rounded-2xl border border-gray-700 shadow-sm flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-100 text-lg truncate">{concept.topic}</p>
                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                    {new Date(concept.createdAt).toLocaleDateString()} 
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`w-10 h-10 flex items-center justify-center text-sm font-bold text-white rounded-full shadow-inner ${scoreColors[concept.confidenceScore - 1] || 'bg-gray-600'}`}>
                                    {concept.confidenceScore}
                                </span>
                                <button
                                    onClick={() => deleteConcept(concept.id)}
                                    className="text-gray-600 p-2 -mr-2 active:scale-90 transition"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-8 text-center text-gray-500 bg-gray-800/30 rounded-2xl border border-gray-800 border-dashed">
                    기록된 내용이 없습니다.
                </div>
            )}
        </div>
      </div>
    );
  };

  // === RHYTHM LOGIC ===
  const RhythmTab = () => {
    const [newHabitName, setNewHabitName] = useState('');
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
      <div className="space-y-6 pb-4 animate-fade-in">
        <div className="bg-pink-900/30 p-4 rounded-2xl border border-pink-700/30">
          <h3 className="text-pink-400 font-bold mb-1 flex items-center gap-2">
            <ActivityIcon className="w-5 h-5" /> 습관 체인
          </h3>
          <p className="text-pink-200/80 text-sm leading-relaxed">
            매일 이어지는 작은 성공이 큰 변화를 만듭니다. 체인을 끊지 마세요.
          </p>
        </div>

        <div className="flex flex-col gap-3">
            <form onSubmit={handleSubmit} className="relative">
                <input
                    type="text"
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    placeholder="새로운 습관 (예: 물 마시기)"
                    className="w-full p-4 pr-14 border border-gray-700 rounded-2xl bg-gray-800 text-gray-100 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button type="submit" className="absolute right-2 top-2 bottom-2 bg-indigo-600 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-indigo-500 active:scale-95 transition">
                    <PlusIcon className="w-6 h-6" />
                </button>
            </form>
        </div>

        <div className="space-y-4">
            <div className="flex justify-between items-end px-1">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">나의 습관</h3>
                <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-lg border border-gray-700">
                    오늘 {habits.filter(isTodayCompleted).length} / {habits.length} 완료
                </span>
            </div>
            
            {habits.length > 0 ? (
                <div className="space-y-3">
                    {habits.map(habit => {
                        const completed = isTodayCompleted(habit);
                        return (
                            <div 
                                key={habit.id}
                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 select-none
                                    ${completed ? 'bg-gray-800/40 border-gray-800 opacity-70' : 'bg-gray-800 border-gray-700 shadow-sm'}`}
                                onClick={() => !completed && completeHabit(habit.id)}
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                                        ${completed ? 'bg-green-600 text-white scale-110' : 'bg-gray-700 text-gray-500'}`}>
                                        {completed ? <CheckCircleIcon className="w-6 h-6" /> : <ActivityIcon className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <p className={`font-bold text-lg ${completed ? 'line-through text-gray-500' : 'text-gray-100'}`}>
                                            {habit.name}
                                        </p>
                                        <div className="flex items-center gap-1 mt-1">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${habit.streak > 0 ? 'bg-pink-500/20 text-pink-400' : 'bg-gray-700 text-gray-500'}`}>
                                                🔥 {habit.streak}일째
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); deleteHabit(habit.id); }}
                                    className="text-gray-600 p-2 -mr-2 active:scale-90 transition"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="py-12 text-center text-gray-500 bg-gray-800/30 rounded-2xl border border-gray-800 border-dashed">
                    <p>습관을 추가하고<br/>체인을 만들어보세요!</p>
                </div>
            )}
        </div>
      </div>
    );
  };

  // === RENDER ===
  return (
    <div className="h-full w-full flex justify-center bg-black">
      <style>{`
        /* Touch Action Optimizations */
        button, input { touch-action: manipulation; }
      `}</style>
      
      {/* Mobile Frame Container (Max width constraint for desktop) */}
      <div className="w-full max-w-md bg-gray-900 h-full flex flex-col relative shadow-2xl overflow-hidden border-x border-gray-800/50">
        
        {/* Fixed Header */}
        <header className="bg-gray-900/90 backdrop-blur-md border-b border-gray-800 p-4 pt-safe z-30 shrink-0">
            <div className="flex justify-between items-center h-10">
                <h1 className="text-xl font-extrabold text-indigo-400 flex items-center gap-2">
                    <ZapIcon className="w-6 h-6" /> Pro-Gro
                </h1>
                <div className="bg-gray-800 border border-gray-700 px-3 py-1 rounded-full text-xs text-gray-300">
                    <span className="font-semibold text-indigo-400">조해솔</span>님
                </div>
            </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto scrollbar-hide bg-gray-900 relative">
            <div className="p-4 pb-24">
                {activeTab === 'proactivity' && <ProactivityTab />}
                {activeTab === 'study' && <StudyTab />}
                {activeTab === 'rhythm' && <RhythmTab />}
            </div>
        </main>

        {/* Fixed Bottom Navigation */}
        <nav className="absolute bottom-0 w-full bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 pb-safe z-40">
            <div className="flex justify-around items-center h-16 px-2">
                <button
                    onClick={() => setActiveTab('proactivity')}
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all active:scale-90
                        ${activeTab === 'proactivity' ? 'text-indigo-400' : 'text-gray-500 hover:text-gray-400'}`}
                >
                    <div className={`p-1 rounded-xl transition-colors ${activeTab === 'proactivity' ? 'bg-indigo-400/10' : ''}`}>
                        <ArrowRightIcon className={`w-6 h-6 ${activeTab === 'proactivity' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                    </div>
                    <span className="text-[10px] font-bold tracking-wide">적극성</span>
                </button>
                
                <button
                    onClick={() => setActiveTab('study')}
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all active:scale-90
                        ${activeTab === 'study' ? 'text-blue-400' : 'text-gray-500 hover:text-gray-400'}`}
                >
                    <div className={`p-1 rounded-xl transition-colors ${activeTab === 'study' ? 'bg-blue-400/10' : ''}`}>
                        <BookOpenIcon className={`w-6 h-6 ${activeTab === 'study' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                    </div>
                    <span className="text-[10px] font-bold tracking-wide">학습</span>
                </button>
                
                <button
                    onClick={() => setActiveTab('rhythm')}
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all active:scale-90
                        ${activeTab === 'rhythm' ? 'text-pink-400' : 'text-gray-500 hover:text-gray-400'}`}
                >
                     <div className={`p-1 rounded-xl transition-colors ${activeTab === 'rhythm' ? 'bg-pink-400/10' : ''}`}>
                        <ActivityIcon className={`w-6 h-6 ${activeTab === 'rhythm' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                     </div>
                    <span className="text-[10px] font-bold tracking-wide">습관</span>
                </button>
            </div>
        </nav>
      </div>
    </div>
  );
};

export default App;