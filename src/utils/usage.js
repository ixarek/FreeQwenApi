/**
 * Нормализация объекта usage к формату, который понимает OpenAI SDK (и Hermes).
 *
 * Qwen Chat возвращает usage в стиле DashScope: { input_tokens, output_tokens }.
 * OpenAI SDK ожидает: { prompt_tokens, completion_tokens, total_tokens }.
 *
 * Функция добавляет недостающие поля как алиасы, НИЧЕГО не ломая:
 * в ответе остаются оба набора имён, чтобы любые клиенты находили нужное поле.
 *
 * @param {object|null|undefined} usage - исходный usage из ответа Qwen
 * @returns {{prompt_tokens:number, completion_tokens:number, total_tokens:number, input_tokens:number, output_tokens:number}}
 */
export function normalizeUsage(usage) {
    const u = usage && typeof usage === 'object' ? usage : {};

    const prompt = u.prompt_tokens ?? u.input_tokens ?? 0;
    const completion = u.completion_tokens ?? u.output_tokens ?? 0;
    const total = u.total_tokens ?? (prompt + completion);

    return {
        ...u,
        prompt_tokens: prompt,
        completion_tokens: completion,
        total_tokens: total,
        // Сохраняем DashScope-имена как алиасы, чтобы не сломать существующих клиентов
        input_tokens: u.input_tokens ?? prompt,
        output_tokens: u.output_tokens ?? completion,
    };
}
