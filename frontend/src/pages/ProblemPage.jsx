import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import Editor from '@monaco-editor/react';
import { useParams } from 'react-router';
import axiosClient from "../utils/axiosClient";
import SubmissionHistory from "../components/SubmissionHistory";
import ChatAi from '../components/ChatAi';
import Editorial from '../components/Editorial';

const langMap = {
  cpp: 'c++',
  java: 'java',
  javascript: 'javaScript'
};

const ProblemPage = () => {
  const [problem, setProblem] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [activeLeftTab, setActiveLeftTab] = useState('description');
  const [activeRightTab, setActiveRightTab] = useState('code');
  const editorRef = useRef(null);
  let { problemId } = useParams();

  const { handleSubmit } = useForm();

  // ═══════════════════════════════════════════════
  // LOGIC — बिल्कुल वैसा ही, कोई बदलाव नहीं
  // ═══════════════════════════════════════════════
  useEffect(() => {
    const fetchProblem = async () => {
      setLoading(true);
      try {
        const response = await axiosClient.get(`/problem/problemById/${problemId}`);


        setProblem(response.data);

        const wanted = langMap[selectedLanguage]?.toLowerCase();
        const starter = response.data.startCode?.find(
          sc => sc.language?.toLowerCase() === wanted
        );
        setCode(starter?.initialCode ?? '// Write your code here');

        setLoading(false);
      } catch (error) {
        console.error('Error fetching problem:', error);
        setLoading(false);
      }
    };

    fetchProblem();
  }, [problemId]);

  useEffect(() => {
    if (!problem) return;

    const wanted = langMap[selectedLanguage]?.toLowerCase();
    const starter = problem.startCode?.find(
      sc => sc.language?.toLowerCase() === wanted
    );
    setCode(starter?.initialCode ?? '// Write your code here');
  }, [selectedLanguage, problem]);

  const handleEditorChange = (value) => {
    setCode(value || '');
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
  };

  const handleRun = async () => {
    setLoading(true);
    setRunResult(null);
    try {
      const response = await axiosClient.post(`/submission/run/${problemId}`, {
        code,
        language: selectedLanguage
      });
      setRunResult(response.data);
      setLoading(false);
      setActiveRightTab('testcase');
    } catch (error) {
      console.error('Error running code:', error);
      setRunResult({ success: false, error: 'Internal server error' });
      setLoading(false);
      setActiveRightTab('testcase');
    }
  };

  const handleSubmitCode = async () => {
    setLoading(true);
    setSubmitResult(null);
    try {
      const response = await axiosClient.post(`/submission/submit/${problemId}`, {
        code: code,
        language: selectedLanguage
      });
      setSubmitResult(response.data);
      setLoading(false);
      setActiveRightTab('result');
    } catch (error) {
      console.error('Error submitting code:', error);
      setSubmitResult(null);
      setLoading(false);
      setActiveRightTab('result');
    }
  };

  const getLanguageForMonaco = (lang) => {
    switch (lang) {
      case 'javascript': return 'javascript';
      case 'java': return 'java';
      case 'cpp': return 'cpp';
      default: return 'javascript';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'hard': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getDifficultyBadge = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'hard':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  // ═══════════════════════════════════════════════
  // LOADING
  // ═══════════════════════════════════════════════
  if (loading && !problem) {
    return (
      <div className="flex flex-col gap-4 justify-center items-center min-h-screen bg-[#0d1117]">
        <span className="loading loading-spinner loading-lg text-indigo-500"></span>
        <p className="text-slate-400 text-sm animate-pulse">Loading problem...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-[#0d1117] text-slate-200 overflow-hidden">
      {/* ═══════════════ LEFT PANEL ═══════════════ */}
      <div className="w-1/2 flex flex-col border-r border-[#1f242c] bg-[#0d1117]">

        {/* Left Tabs */}
        <div className="flex items-center gap-1 bg-[#0d1117] px-3 pt-3 border-b border-[#1f242c]">
          {[
            { key: 'description', label: 'Description' },
            { key: 'editorial', label: 'Editorial' },
            { key: 'solutions', label: 'Solutions' },
            { key: 'submissions', label: 'Submissions' },
            { key: 'chatAI', label: 'ChatAI' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveLeftTab(key)}
              className={`relative px-3 py-2 text-sm font-medium rounded-t-md transition-all duration-200 ${
                activeLeftTab === key
                  ? 'text-white bg-[#161b22]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#161b22]/60'
              }`}
            >
              {label}
              {activeLeftTab === key && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"></span>
              )}
            </button>
          ))}
        </div>

        {/* Left Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {problem && (
            <>
              {/* ═══ DESCRIPTION ═══ */}
              {activeLeftTab === 'description' && (
                <div className="animate-fadeIn">
                  <div className="flex items-center flex-wrap gap-3 mb-6">
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                      {problem.title}
                    </h1>
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full border ${getDifficultyBadge(problem.difficulty)}`}
                    >
                      {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                    </span>
                    <span className="text-xs font-medium px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                      {problem.tags}
                    </span>
                  </div>

                  <div className="prose prose-invert max-w-none">
                    <div className="text-[15px] leading-7 text-slate-300 whitespace-pre-wrap">
                      {problem.description}
                    </div>
                  </div>

                  <div className="mt-10">
                    <h3 className="text-base font-semibold mb-4 text-white flex items-center gap-2">
                      <span className="w-1 h-5 bg-gradient-to-b from-indigo-500 to-violet-500 rounded-full"></span>
                      Examples
                    </h3>
                    <div className="space-y-4">
                      {problem.visibleTestCases.map((example, index) => (
                        <div
                          key={index}
                          className="bg-[#161b22] border border-[#1f242c] p-5 rounded-xl hover:border-indigo-500/40 transition-colors duration-200"
                        >
                          <h4 className="font-semibold mb-3 text-slate-200 text-sm">
                            Example {index + 1}
                          </h4>
                          <div className="space-y-2.5 text-[13px] font-mono">
                            <div className="flex gap-3">
                              <span className="text-slate-500 min-w-[80px]">Input:</span>
                              <span className="text-emerald-400">{example.input}</span>
                            </div>
                            <div className="flex gap-3">
                              <span className="text-slate-500 min-w-[80px]">Output:</span>
                              <span className="text-amber-400">{example.output}</span>
                            </div>
                            <div className="flex gap-3">
                              <span className="text-slate-500 min-w-[80px]">Explanation:</span>
                              <span className="text-slate-300">{example.explanation}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ EDITORIAL ═══ */}
              {activeLeftTab === 'editorial' && (
                <div className="animate-fadeIn">
                  <h2 className="text-xl font-bold mb-5 text-white flex items-center gap-2">
                    <span className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-violet-500 rounded-full"></span>
                    Editorial
                  </h2>
                  <Editorial
                    secureUrl={problem.secureUrl}
                    thumbnailUrl={problem.thumbnailUrl}
                    duration={problem.duration}
                  />
                </div>
              )}

              {/* ═══ SOLUTIONS ═══ */}
              {activeLeftTab === 'solutions' && (
                <div className="animate-fadeIn">
                  <h2 className="text-xl font-bold mb-5 text-white flex items-center gap-2">
                    <span className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-violet-500 rounded-full"></span>
                    Solutions
                  </h2>
                  <div className="space-y-6">
                    {problem.referenceSolution?.map((solution, index) => (
                      <div
                        key={index}
                        className="border border-[#1f242c] rounded-xl overflow-hidden hover:border-indigo-500/40 transition-colors duration-200"
                      >
                        <div className="bg-[#161b22] px-4 py-2.5 flex items-center justify-between">
                          <h3 className="font-semibold text-sm text-slate-200">
                            {problem?.title} — {solution?.language}
                          </h3>
                          <span className="text-xs text-indigo-400 font-mono">
                            {solution?.language}
                          </span>
                        </div>
                        <div className="p-0">
                          <pre className="bg-[#0d1117] p-4 text-[13px] overflow-x-auto">
                            <code className="text-slate-300 font-mono">
                              {solution?.completeCode}
                            </code>
                          </pre>
                        </div>
                      </div>
                    )) || (
                      <p className="text-slate-500 text-sm">
                        Solutions will be available after you solve the problem.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ═══ SUBMISSIONS ═══ */}
              {activeLeftTab === 'submissions' && (
                <div className="animate-fadeIn">
                  <h2 className="text-xl font-bold mb-5 text-white flex items-center gap-2">
                    <span className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-violet-500 rounded-full"></span>
                    My Submissions
                  </h2>
                  <SubmissionHistory problemId={problemId} />
                </div>
              )}

              {/* ═══ CHAT AI ═══ */}
              {activeLeftTab === 'chatAI' && (
                <div className="animate-fadeIn">
                  <h2 className="text-xl font-bold mb-5 text-white flex items-center gap-2">
                    <span className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-violet-500 rounded-full"></span>
                    Chat with AI
                  </h2>
                  <ChatAi problem={problem} />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ═══════════════ RIGHT PANEL ═══════════════ */}
      <div className="w-1/2 flex flex-col bg-[#0d1117]">

        {/* Right Tabs */}
        <div className="flex items-center gap-1 bg-[#0d1117] px-3 pt-3 border-b border-[#1f242c]">
          {[
            { key: 'code', label: 'Code' },
            { key: 'testcase', label: 'Testcase' },
            { key: 'result', label: 'Result' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveRightTab(key)}
              className={`relative px-3 py-2 text-sm font-medium rounded-t-md transition-all duration-200 ${
                activeRightTab === key
                  ? 'text-white bg-[#161b22]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#161b22]/60'
              }`}
            >
              {label}
              {activeRightTab === key && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"></span>
              )}
            </button>
          ))}
        </div>

        {/* Right Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {activeRightTab === 'code' && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Language Selector */}
              <div className="flex justify-between items-center px-4 py-3 border-b border-[#1f242c] bg-[#0d1117]">
                <div className="flex gap-2">
                  {['javascript', 'java', 'cpp'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => handleLanguageChange(lang)}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                        selectedLanguage === lang
                          ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20'
                          : 'bg-[#161b22] text-slate-400 hover:text-white hover:bg-[#1f242c] border border-[#1f242c]'
                      }`}
                    >
                      {lang === 'cpp' ? 'C++' : lang === 'javascript' ? 'JavaScript' : 'Java'}
                    </button>
                  ))}
                </div>
                <div className="text-[11px] text-slate-500 font-mono uppercase tracking-wider">
                  Editor
                </div>
              </div>

              {/* Monaco Editor */}
              <div className="flex-1 min-h-0">
                <Editor
                  height="100%"
                  language={getLanguageForMonaco(selectedLanguage)}
                  value={code}
                  onChange={handleEditorChange}
                  onMount={handleEditorDidMount}
                  theme="vs-dark"
                  options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    insertSpaces: true,
                    wordWrap: 'on',
                    lineNumbers: 'on',
                    glyphMargin: false,
                    folding: true,
                    lineDecorationsWidth: 10,
                    lineNumbersMinChars: 3,
                    renderLineHighlight: 'line',
                    selectOnLineNumbers: true,
                    roundedSelection: false,
                    readOnly: false,
                    cursorStyle: 'line',
                    mouseWheelZoom: true,
                    padding: { top: 12, bottom: 12 },
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div className="px-4 py-3 border-t border-[#1f242c] bg-[#0d1117] flex justify-between items-center">
                <button
                  onClick={() => setActiveRightTab('testcase')}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-slate-400 hover:text-white hover:bg-[#161b22] transition-colors duration-200 flex items-center gap-2"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Console
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={handleRun}
                    disabled={loading}
                    className={`px-5 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-200 flex items-center gap-2 ${
                      loading
                        ? 'border-slate-700 text-slate-500 cursor-not-allowed'
                        : 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/60'
                    }`}
                  >
                    {loading ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.841z" />
                      </svg>
                    )}
                    Run
                  </button>
                  <button
                    onClick={handleSubmitCode}
                    disabled={loading}
                    className={`px-5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg ${
                      loading
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-500/30'
                    }`}
                  >
                    {loading ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    Submit
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══ TESTCASE ═══ */}
          {activeRightTab === 'testcase' && (
            <div className="flex-1 p-5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              <h3 className="font-semibold mb-4 text-white flex items-center gap-2 text-sm">
                <span className="w-1 h-4 bg-gradient-to-b from-indigo-500 to-violet-500 rounded-full"></span>
                Test Results
              </h3>

              {runResult ? (
                <div className="animate-fadeIn">
                  {runResult.success ? (
                    <div className="space-y-4">
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <h4 className="font-bold text-emerald-400">All test cases passed!</h4>
                        </div>
                        <div className="flex gap-6 text-xs text-slate-400 mt-3 font-mono">
                          <span>Runtime: <span className="text-emerald-400">{runResult.runtime} sec</span></span>
                          <span>Memory: <span className="text-emerald-400">{runResult.memory} KB</span></span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {runResult.testCases.map((tc, i) => (
                          <div key={i} className="bg-[#161b22] border border-[#1f242c] p-4 rounded-xl text-xs">
                            <div className="font-mono space-y-2">
                              <div className="flex gap-3">
                                <span className="text-slate-500 min-w-[70px]">Input:</span>
                                <span className="text-slate-300">{tc.stdin}</span>
                              </div>
                              <div className="flex gap-3">
                                <span className="text-slate-500 min-w-[70px]">Expected:</span>
                                <span className="text-slate-300">{tc.expected_output}</span>
                              </div>
                              <div className="flex gap-3">
                                <span className="text-slate-500 min-w-[70px]">Output:</span>
                                <span className="text-slate-300">{tc.stdout}</span>
                              </div>
                              <div className="text-emerald-400 pt-1">✓ Passed</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-rose-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <h4 className="font-bold text-rose-400">Error</h4>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {runResult.testCases?.map((tc, i) => (
                          <div key={i} className="bg-[#161b22] border border-[#1f242c] p-4 rounded-xl text-xs">
                            <div className="font-mono space-y-2">
                              <div className="flex gap-3">
                                <span className="text-slate-500 min-w-[70px]">Input:</span>
                                <span className="text-slate-300">{tc.stdin}</span>
                              </div>
                              <div className="flex gap-3">
                                <span className="text-slate-500 min-w-[70px]">Expected:</span>
                                <span className="text-slate-300">{tc.expected_output}</span>
                              </div>
                              <div className="flex gap-3">
                                <span className="text-slate-500 min-w-[70px]">Output:</span>
                                <span className="text-slate-300">{tc.stdout}</span>
                              </div>
                              <div className={`pt-1 ${tc.status_id == 3 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {tc.status_id == 3 ? '✓ Passed' : '✗ Failed'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 rounded-full bg-[#161b22] flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-slate-500 text-sm">
                    Click <span className="text-emerald-400 font-semibold">"Run"</span> to test your code
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ═══ RESULT ═══ */}
          {activeRightTab === 'result' && (
            <div className="flex-1 p-5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              <h3 className="font-semibold mb-4 text-white flex items-center gap-2 text-sm">
                <span className="w-1 h-4 bg-gradient-to-b from-indigo-500 to-violet-500 rounded-full"></span>
                Submission Result
              </h3>

              {submitResult ? (
                <div className="animate-fadeIn">
                  {submitResult.accepted ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <h4 className="font-bold text-lg text-emerald-400">🎉 Accepted</h4>
                      </div>
                      <div className="space-y-2.5 text-sm text-slate-300">
                        <div className="flex justify-between py-2 border-b border-emerald-500/10">
                          <span className="text-slate-400">Test Cases Passed</span>
                          <span className="font-mono text-emerald-400">
                            {submitResult.passedTestCases}/{submitResult.totalTestCases}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-emerald-500/10">
                          <span className="text-slate-400">Runtime</span>
                          <span className="font-mono text-emerald-400">{submitResult.runtime} sec</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-slate-400">Memory</span>
                          <span className="font-mono text-emerald-400">{submitResult.memory} KB</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
                          <svg className="w-5 h-5 text-rose-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <h4 className="font-bold text-lg text-rose-400">
                          ❌ {submitResult.error || 'Failed'}
                        </h4>
                      </div>
                      <div className="space-y-2.5 text-sm">
                        <div className="flex justify-between py-2">
                          <span className="text-slate-400">Test Cases Passed</span>
                          <span className="font-mono text-rose-400">
                            {submitResult.passedTestCases}/{submitResult.totalTestCases}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 rounded-full bg-[#161b22] flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-slate-500 text-sm">
                    Click <span className="text-indigo-400 font-semibold">"Submit"</span> to evaluate
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══ Custom animations ═══ */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ProblemPage;