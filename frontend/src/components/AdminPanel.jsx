import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axiosClient from '../utils/axiosClient';
import { useNavigate } from 'react-router';

// Zod schema matching the problem schema
const problemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.enum(['array', 'linkedList', 'graph', 'dp']),
  visibleTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string().min(1, 'Output is required'),
      explanation: z.string().min(1, 'Explanation is required')
    })
  ).min(1, 'At least one visible test case required'),
  hiddenTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string().min(1, 'Output is required')
    })
  ).min(1, 'At least one hidden test case required'),
  startCode: z.array(
    z.object({
      language: z.enum(['C++', 'Java', 'JavaScript']),
      initialCode: z.string().min(1, 'Initial code is required')
    })
  ).length(3, 'All three languages required'),
  referenceSolution: z.array(
    z.object({
      language: z.enum(['C++', 'Java', 'JavaScript']),
      completeCode: z.string().min(1, 'Complete code is required')
    })
  ).length(3, 'All three languages required')
});

// Language metadata for beautiful UI (design-only helper)
const LANGUAGES = [
  { key: 'C++', badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30', dot: 'bg-sky-400' },
  { key: 'Java', badge: 'bg-orange-500/15 text-orange-300 border-orange-500/30', dot: 'bg-orange-400' },
  { key: 'JavaScript', badge: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30', dot: 'bg-yellow-400' }
];

function AdminPanel() {
  const navigate = useNavigate();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(problemSchema),
    defaultValues: {
      startCode: [
        { language: 'C++', initialCode: '' },
        { language: 'Java', initialCode: '' },
        { language: 'JavaScript', initialCode: '' }
      ],
      referenceSolution: [
        { language: 'C++', completeCode: '' },
        { language: 'Java', completeCode: '' },
        { language: 'JavaScript', completeCode: '' }
      ]
    }
  });

  const {
    fields: visibleFields,
    append: appendVisible,
    remove: removeVisible
  } = useFieldArray({
    control,
    name: 'visibleTestCases'
  });

  const {
    fields: hiddenFields,
    append: appendHidden,
    remove: removeHidden
  } = useFieldArray({
    control,
    name: 'hiddenTestCases'
  });

  const onSubmit = async (data) => {
    try {
      await axiosClient.post('/problem/create', data);
      alert('Problem created successfully!');
      navigate('/');
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  // Shared input base classes for consistency
  const inputBase =
    'w-full rounded-xl bg-slate-900/60 border border-slate-700 text-slate-100 placeholder-slate-500 ' +
    'px-4 py-2.5 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-indigo-400 font-semibold mb-1">
              Admin · Problem Builder
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              Create New Problem
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Fill in the details below to publish a new coding challenge.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400 border border-slate-700 rounded-full px-3 py-1.5 bg-slate-900/60">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            draft mode
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* ================= BASIC INFORMATION ================= */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-sm shadow-xl shadow-black/30 overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800 bg-slate-900/50">
              <span className="w-1.5 h-6 rounded-full bg-indigo-500" />
              <h2 className="text-lg font-semibold text-slate-100">Basic Information</h2>
            </div>

            <div className="p-6 space-y-5">
              {/* Title */}
              <div className="form-control">
                <label className="label pb-1.5">
                  <span className="text-sm font-medium text-slate-300">
                    Title <span className="text-indigo-400">*</span>
                  </span>
                </label>
                <input
                  {...register('title')}
                  placeholder="e.g. Two Sum"
                  className={`${inputBase} ${errors.title ? 'border-red-500/60 focus:border-red-400 focus:ring-red-500/30' : ''}`}
                />
                {errors.title && (
                  <span className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                    <span>⚠</span> {errors.title.message}
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="form-control">
                <label className="label pb-1.5">
                  <span className="text-sm font-medium text-slate-300">
                    Description <span className="text-indigo-400">*</span>
                  </span>
                </label>
                <textarea
                  {...register('description')}
                  placeholder="Write a clear problem statement..."
                  rows={5}
                  className={`${inputBase} resize-y ${errors.description ? 'border-red-500/60 focus:border-red-400 focus:ring-red-500/30' : ''}`}
                />
                {errors.description && (
                  <span className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                    <span>⚠</span> {errors.description.message}
                  </span>
                )}
              </div>

              {/* Difficulty + Tag */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="form-control">
                  <label className="label pb-1.5">
                    <span className="text-sm font-medium text-slate-300">Difficulty</span>
                  </label>
                  <select
                    {...register('difficulty')}
                    className={`${inputBase} cursor-pointer appearance-none ${errors.difficulty ? 'border-red-500/60' : ''}`}
                  >
                    <option value="easy" className="bg-slate-900">🟢 Easy</option>
                    <option value="medium" className="bg-slate-900">🟡 Medium</option>
                    <option value="hard" className="bg-slate-900">🔴 Hard</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label pb-1.5">
                    <span className="text-sm font-medium text-slate-300">Tag</span>
                  </label>
                  <select
                    {...register('tags')}
                    className={`${inputBase} cursor-pointer appearance-none ${errors.tags ? 'border-red-500/60' : ''}`}
                  >
                    <option value="array" className="bg-slate-900">Array</option>
                    <option value="linkedList" className="bg-slate-900">Linked List</option>
                    <option value="graph" className="bg-slate-900">Graph</option>
                    <option value="dp" className="bg-slate-900">DP</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* ================= TEST CASES ================= */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-sm shadow-xl shadow-black/30 overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800 bg-slate-900/50">
              <span className="w-1.5 h-6 rounded-full bg-emerald-500" />
              <h2 className="text-lg font-semibold text-slate-100">Test Cases</h2>
            </div>

            <div className="p-6 space-y-8">

              {/* ---------- Visible Test Cases ---------- */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px] shadow-emerald-400/60" />
                    Visible Test Cases
                  </h3>
                  <button
                    type="button"
                    onClick={() => appendVisible({ input: '', output: '', explanation: '' })}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] transition text-white text-xs font-semibold px-3.5 py-2 shadow-lg shadow-emerald-900/40"
                  >
                    <span className="text-base leading-none">＋</span> Add Visible Case
                  </button>
                </div>

                {visibleFields.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 py-6 text-center text-sm text-slate-500">
                    No visible test cases yet. Click <span className="text-emerald-400 font-medium">"Add Visible Case"</span> to start.
                  </div>
                )}

                {visibleFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 sm:p-5 space-y-4 hover:border-emerald-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-slate-500">
                        # visible-{String(index + 1).padStart(2, '0')}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeVisible(index)}
                        className="inline-flex items-center gap-1 rounded-md bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-medium px-2.5 py-1 transition"
                      >
                        ✕ Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label pb-1">
                          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Input *</span>
                        </label>
                        <input
                          {...register(`visibleTestCases.${index}.input`)}
                          placeholder="e.g. nums = [2,7,11,15], target = 9"
                          className={`${inputBase} ${errors?.visibleTestCases?.[index]?.input ? 'border-red-500/60' : ''}`}
                        />
                        {errors?.visibleTestCases?.[index]?.input && (
                          <span className="text-red-400 text-xs mt-1">{errors.visibleTestCases[index].input.message}</span>
                        )}
                      </div>

                      <div className="form-control">
                        <label className="label pb-1">
                          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Output *</span>
                        </label>
                        <input
                          {...register(`visibleTestCases.${index}.output`)}
                          placeholder="e.g. [0,1]"
                          className={`${inputBase} ${errors?.visibleTestCases?.[index]?.output ? 'border-red-500/60' : ''}`}
                        />
                        {errors?.visibleTestCases?.[index]?.output && (
                          <span className="text-red-400 text-xs mt-1">{errors.visibleTestCases[index].output.message}</span>
                        )}
                      </div>
                    </div>

                    <div className="form-control">
                      <label className="label pb-1">
                        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Explanation *</span>
                      </label>
                      <textarea
                        {...register(`visibleTestCases.${index}.explanation`)}
                        placeholder="Explain why this output is correct..."
                        rows={2}
                        className={`${inputBase} resize-y ${errors?.visibleTestCases?.[index]?.explanation ? 'border-red-500/60' : ''}`}
                      />
                      {errors?.visibleTestCases?.[index]?.explanation && (
                        <span className="text-red-400 text-xs mt-1">{errors.visibleTestCases[index].explanation.message}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

              {/* ---------- Hidden Test Cases ---------- */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px] shadow-amber-400/60" />
                    Hidden Test Cases
                  </h3>
                  <button
                    type="button"
                    onClick={() => appendHidden({ input: '', output: '' })}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 active:scale-[0.98] transition text-white text-xs font-semibold px-3.5 py-2 shadow-lg shadow-amber-900/40"
                  >
                    <span className="text-base leading-none">＋</span> Add Hidden Case
                  </button>
                </div>

                {hiddenFields.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 py-6 text-center text-sm text-slate-500">
                    No hidden test cases yet. Click <span className="text-amber-400 font-medium">"Add Hidden Case"</span> to start.
                  </div>
                )}

                {hiddenFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 sm:p-5 space-y-4 hover:border-amber-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-slate-500">
                        # hidden-{String(index + 1).padStart(2, '0')}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeHidden(index)}
                        className="inline-flex items-center gap-1 rounded-md bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-medium px-2.5 py-1 transition"
                      >
                        ✕ Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label pb-1">
                          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Input *</span>
                        </label>
                        <input
                          {...register(`hiddenTestCases.${index}.input`)}
                          placeholder="e.g. nums = [3,2,4], target = 6"
                          className={`${inputBase} ${errors?.hiddenTestCases?.[index]?.input ? 'border-red-500/60' : ''}`}
                        />
                        {errors?.hiddenTestCases?.[index]?.input && (
                          <span className="text-red-400 text-xs mt-1">{errors.hiddenTestCases[index].input.message}</span>
                        )}
                      </div>

                      <div className="form-control">
                        <label className="label pb-1">
                          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Output *</span>
                        </label>
                        <input
                          {...register(`hiddenTestCases.${index}.output`)}
                          placeholder="e.g. [1,2]"
                          className={`${inputBase} ${errors?.hiddenTestCases?.[index]?.output ? 'border-red-500/60' : ''}`}
                        />
                        {errors?.hiddenTestCases?.[index]?.output && (
                          <span className="text-red-400 text-xs mt-1">{errors.hiddenTestCases[index].output.message}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ================= CODE TEMPLATES ================= */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-sm shadow-xl shadow-black/30 overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800 bg-slate-900/50">
              <span className="w-1.5 h-6 rounded-full bg-sky-500" />
              <h2 className="text-lg font-semibold text-slate-100">Code Templates</h2>
            </div>

            <div className="p-6 space-y-8">
              {LANGUAGES.map((lang, index) => (
                <div key={lang.key} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-mono font-semibold ${lang.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${lang.dot}`} />
                      {lang.key}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div className="form-control">
                      <label className="label pb-1.5">
                        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                          Initial Code *
                        </span>
                      </label>
                      <textarea
                        {...register(`startCode.${index}.initialCode`)}
                        rows={7}
                        spellCheck={false}
                        placeholder={`// Starter code for ${lang.key}`}
                        className={`w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-sm p-4 outline-none resize-y transition
                          focus:border-sky-400 focus:ring-2 focus:ring-sky-500/30 leading-relaxed
                          ${errors?.startCode?.[index]?.initialCode ? 'border-red-500/60' : ''}`}
                      />
                      {errors?.startCode?.[index]?.initialCode && (
                        <span className="text-red-400 text-xs mt-1">
                          {errors.startCode[index].initialCode.message}
                        </span>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label pb-1.5">
                        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                          Reference Solution *
                        </span>
                      </label>
                      <textarea
                        {...register(`referenceSolution.${index}.completeCode`)}
                        rows={7}
                        spellCheck={false}
                        placeholder={`// Complete solution for ${lang.key}`}
                        className={`w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-sm p-4 outline-none resize-y transition
                          focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 leading-relaxed
                          ${errors?.referenceSolution?.[index]?.completeCode ? 'border-red-500/60' : ''}`}
                      />
                      {errors?.referenceSolution?.[index]?.completeCode && (
                        <span className="text-red-400 text-xs mt-1">
                          {errors.referenceSolution[index].completeCode.message}
                        </span>
                      )}
                    </div>
                  </div>

                  {index < LANGUAGES.length - 1 && (
                    <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ================= SUBMIT ================= */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 pb-10">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 font-medium px-6 py-3 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-semibold px-8 py-3 shadow-lg shadow-indigo-900/50 transition-all active:scale-[0.98]"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <span>✦</span> Create Problem
              </span>
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminPanel;