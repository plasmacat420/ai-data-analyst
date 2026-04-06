const QUESTIONS = {
  'sales.csv': [
    'What are the top 5 products by revenue?',
    'Show monthly revenue trend for 2024',
    'Which region performs best?',
    'What is the revenue breakdown by category?',
  ],
  'employees.csv': [
    'What is the average salary by department?',
    'Who are the top 10 performers by score?',
    'Show hiring trend by year',
    'Which department has the highest average salary?',
  ],
  'ecommerce.csv': [
    'What are the most ordered products?',
    'Show order status breakdown',
    'Which city has the most orders?',
    'What is the monthly revenue trend?',
  ],
}

export default function SampleQuestions({ dataset, onSelect }) {
  if (!dataset) return null
  const questions = QUESTIONS[dataset.filename] || []
  if (!questions.length) return null

  return (
    <div className="mt-3">
      <p className="text-slate-500 text-xs mb-2">Try these questions:</p>
      <div className="flex flex-wrap gap-2">
        {questions.map((q) => (
          <button
            key={q}
            onClick={() => onSelect(q)}
            className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-violet-500 text-slate-300 hover:text-violet-300 px-3 py-1.5 rounded-full transition-all"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}
