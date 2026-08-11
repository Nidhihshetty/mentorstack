"use server";
import nspell from "nspell";
import dictionary from "dictionary-en";

let spell: nspell | null = null;

export async function initSpellchecker() {
    if (spell) return spell;
    return new Promise<nspell>((resolve, reject) => {
        dictionary((err, dict) => {
            if (err) reject(err);
            else {
                spell = nspell(dict);
                resolve(spell);
            }
        });
    });
}

export async function checkSpelling(text: string) {
    const spellInstance = await initSpellchecker();
    const words = text.split(/\b/); // split keeping punctuation boundaries
    const corrections: {
        word: string;
        indexStart: number;
        indexEnd: number;
        suggestions: string[];
    }[] = [];

    let index = 0;
    for (const w of words) {
        if (/^[a-zA-Z]+$/.test(w)) {
            const start = index;
            const end = index + w.length;
            if (!spellInstance.correct(w)) {
                corrections.push({
                    word: w,
                    indexStart: start,
                    indexEnd: end,
                    suggestions: spellInstance.suggest(w),
                });
            }
        }
        index += w.length;
    }

    return corrections;
}
