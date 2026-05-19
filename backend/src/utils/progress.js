export function documentProgress(documents = []) {
  if (!documents.length) return 0;
  const completed = documents.filter((doc) => doc.isCompleted).length;
  return Math.round((completed / documents.length) * 100);
}

export function documentsRemaining(documents = []) {
  return documents.filter((doc) => !doc.isCompleted && !doc.isOptional).length;
}

export function categoryProgress(universities = []) {
  const groups = new Map();
  for (const university of universities) {
    for (const doc of university.Documents || university.documents || []) {
      const category = doc.category || "Custom";
      const current = groups.get(category) || { category, total: 0, completed: 0, percent: 0 };
      current.total += 1;
      if (doc.isCompleted) current.completed += 1;
      current.percent = Math.round((current.completed / current.total) * 100);
      groups.set(category, current);
    }
  }
  return Array.from(groups.values()).sort((a, b) => b.percent - a.percent || a.category.localeCompare(b.category));
}

