const axios = require('axios')

const LANGUAGE_IDS = {
  javascript: 63,
  python: 71,
  java: 62,
  cpp: 54
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const runCode = async (code, language) => {
  const languageId = LANGUAGE_IDS[language]

  if (!languageId) {
    return { output: `Language '${language}' is not supported.` }
  }

  try {
    // Step 1: submit the code
    const submitRes = await axios.post(
      `${process.env.JUDGE0_URL}/submissions`,
      {
        source_code: code,
        language_id: languageId,
        stdin: ''
      },
      {
        headers: { 'Content-Type': 'application/json' },
        params: { base64_encoded: 'false', wait: 'false' }
      }
    )

    const token = submitRes.data.token

    // Step 2: poll for result (max 10 attempts)
    let result = null
    for (let i = 0; i < 10; i++) {
      await sleep(1000)

      const pollRes = await axios.get(
        `${process.env.JUDGE0_URL}/submissions/${token}`,
        {
          params: { base64_encoded: 'false' }
        }
      )

      result = pollRes.data

      // status 1 = queued, 2 = processing, 3+ = done
      if (result.status?.id >= 3) break
    }

    if (!result) {
      return { output: 'Execution timed out. Please try again.' }
    }

    if (result.status?.id === 3) {
      return {
        output: result.stdout || '(no output)',
        status: 'success'
      }
    } else if (result.stderr) {
      return {
        output: `Error:\n${result.stderr}`,
        status: 'error'
      }
    } else if (result.compile_output) {
      return {
        output: `Compilation error:\n${result.compile_output}`,
        status: 'error'
      }
    } else {
      return {
        output: `Status: ${result.status?.description || 'Unknown'}`,
        status: 'error'
      }
    }

  } catch (err) {
    console.error('Judge0 error:', err.message)
    return { output: `Execution failed: ${err.message}`, status: 'error' }
  }
}

module.exports = { runCode }