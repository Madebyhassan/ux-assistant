const analyze = async ({ description, focusAreas, context, url }) => {
  setIsLoading(true);
  setError(null);

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, focusAreas, context, url }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Something went wrong");
    }

    return data;
  } catch (err) {
    setError(err.message);
    return null;
  } finally {
    setIsLoading(false);
  }
};
