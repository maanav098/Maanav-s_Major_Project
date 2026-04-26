import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Loader2, Terminal, AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { interviewApi } from '../services/api';

interface Language {
  id: string;
  label: string;
  version: string;
  monaco: string;
  starter: string;
}

const LANGUAGES: Language[] = [
  {
    id: 'python',
    label: 'Python',
    version: '3.10.0',
    monaco: 'python',
    starter: '# Write your solution\n\ndef solve():\n    pass\n\nsolve()\n',
  },
  {
    id: 'javascript',
    label: 'JavaScript',
    version: '18.15.0',
    monaco: 'javascript',
    starter: '// Write your solution\n\nfunction solve() {\n  \n}\n\nsolve();\n',
  },
  {
    id: 'typescript',
    label: 'TypeScript',
    version: '5.0.3',
    monaco: 'typescript',
    starter: '// Write your solution\n\nfunction solve(): void {\n  \n}\n\nsolve();\n',
  },
  {
    id: 'java',
    label: 'Java',
    version: '15.0.2',
    monaco: 'java',
    starter:
      'public class Main {\n    public static void main(String[] args) {\n        \n    }\n}\n',
  },
  {
    id: 'cpp',
    label: 'C++',
    version: '10.2.0',
    monaco: 'cpp',
    starter:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n',
  },
  {
    id: 'go',
    label: 'Go',
    version: '1.16.2',
    monaco: 'go',
    starter: 'package main\n\nimport "fmt"\n\nfunc main() {\n    _ = fmt.Println\n}\n',
  },
];

interface CodeEditorProps {
  languageId: string;
  onLanguageChange: (id: string) => void;
  code: string;
  onCodeChange: (code: string) => void;
  disabled?: boolean;
}

interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  error?: string;
}

export default function CodeEditor({
  languageId,
  onLanguageChange,
  code,
  onCodeChange,
  disabled,
}: CodeEditorProps) {
  const { theme } = useTheme();
  const [stdin, setStdin] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);

  const language = LANGUAGES.find((l) => l.id === languageId) || LANGUAGES[0];

  const handleLanguageChange = (newId: string) => {
    const newLang = LANGUAGES.find((l) => l.id === newId);
    if (!newLang) return;
    if (!code.trim()) {
      onCodeChange(newLang.starter);
    }
    onLanguageChange(newId);
    setResult(null);
  };

  const runCode = async () => {
    if (!code.trim()) return;
    setRunning(true);
    setResult(null);

    try {
      const data = await interviewApi.runCode({
        language: language.id,
        version: language.version,
        source: code,
        stdin,
      });
      setResult({
        stdout: data.stdout || '',
        stderr: data.stderr || '',
        exitCode: data.exitCode,
        error: data.error,
      });
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      setResult({
        stdout: '',
        stderr: '',
        exitCode: null,
        error: detail || (e instanceof Error ? e.message : 'Network error'),
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <label className="eyebrow">Language</label>
          <select
            value={languageId}
            onChange={(e) => handleLanguageChange(e.target.value)}
            disabled={disabled || running}
            className="input-field-boxed"
            style={{ width: 'auto', fontSize: '13px', padding: '0.4rem 0.6rem' }}
          >
            {LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={runCode}
          disabled={disabled || running || !code.trim()}
          className="btn-secondary"
        >
          {running ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Running…</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Run code</span>
            </>
          )}
        </button>
      </div>

      <div className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
        <Editor
          height="360px"
          language={language.monaco}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          value={code}
          onChange={(v) => onCodeChange(v || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            readOnly: disabled,
          }}
        />
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
          Custom input (stdin)
        </summary>
        <textarea
          value={stdin}
          onChange={(e) => setStdin(e.target.value)}
          rows={3}
          className="input-field mt-2 font-mono text-sm"
          placeholder="Input passed to your program's stdin (optional)"
        />
      </details>

      {result && (
        <div className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Terminal className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Output
              </span>
            </div>
            {result.exitCode !== null && (
              <span
                className={`text-xs font-mono px-2 py-0.5 rounded ${
                  result.exitCode === 0
                    ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                    : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                }`}
              >
                exit {result.exitCode}
              </span>
            )}
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-900 font-mono text-xs whitespace-pre-wrap max-h-60 overflow-auto">
            {result.error && (
              <div className="flex items-start space-x-2 text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{result.error}</span>
              </div>
            )}
            {result.stdout && (
              <div className="text-gray-900 dark:text-gray-100">{result.stdout}</div>
            )}
            {result.stderr && (
              <div className="text-red-600 dark:text-red-400 mt-2">{result.stderr}</div>
            )}
            {!result.error && !result.stdout && !result.stderr && (
              <div className="text-gray-500 dark:text-gray-500 italic">
                (no output)
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export { LANGUAGES };
