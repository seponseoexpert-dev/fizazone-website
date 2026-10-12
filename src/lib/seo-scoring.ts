export type SeoCheckResult = {
  id: string;
  label: string;
  passed: boolean;
  score: number;
  maxScore: number;
  tip: string;
};

export type SeoAudit = {
  score: number;
  rating: "excellent" | "good" | "fair" | "poor";
  badgeColor: string;
  checks: SeoCheckResult[];
};

export function calculateCategorySeoScore({
  title = "",
  description = "",
  slug = "",
  name = "",
  shortDesc = "",
  bannerImage = "",
  faqsCount = 0,
}: {
  title?: string;
  description?: string;
  slug?: string;
  name?: string;
  shortDesc?: string;
  bannerImage?: string;
  faqsCount?: number;
}): SeoAudit {
  const cleanTitle = title.trim();
  const cleanDesc = description.trim();
  const cleanSlug = slug.trim();
  const cleanName = name.trim().toLowerCase();

  const checks: SeoCheckResult[] = [];

  // 1. Title length (ideal: 40-60 characters)
  const titleLen = cleanTitle.length;
  let titleScore = 0;
  let titleTip = "Ideal SEO Title is between 40 and 60 characters.";
  if (titleLen >= 40 && titleLen <= 60) {
    titleScore = 25;
    titleTip = `Perfect title length (${titleLen}/60 chars). Displays nicely on Google search.`;
  } else if ((titleLen >= 25 && titleLen < 40) || (titleLen > 60 && titleLen <= 70)) {
    titleScore = 15;
    titleTip = `Title is ${titleLen} chars. Try aiming for 45-60 characters for best CTR.`;
  } else if (titleLen > 0) {
    titleScore = 5;
    titleTip = titleLen > 70 ? "Title is too long and may get truncated by Google." : "Title is too short.";
  } else {
    titleTip = "Add an SEO Title to rank in search results.";
  }
  checks.push({
    id: "title_length",
    label: "Title Length",
    passed: titleScore >= 20,
    score: titleScore,
    maxScore: 25,
    tip: titleTip,
  });

  // 2. Keyword in title
  let keywordScore = 0;
  let keywordTip = `Include your category keyword "${name}" in the SEO Title.`;
  if (cleanName && cleanTitle.toLowerCase().includes(cleanName)) {
    keywordScore = 15;
    keywordTip = `Primary keyword "${name}" is present in title.`;
  }
  checks.push({
    id: "title_keyword",
    label: "Keyword in Title",
    passed: keywordScore === 15,
    score: keywordScore,
    maxScore: 15,
    tip: keywordTip,
  });

  // 3. Meta Description length (ideal: 120-160 characters)
  const descLen = cleanDesc.length;
  let descScore = 0;
  let descTip = "Ideal Meta Description is between 120 and 160 characters.";
  if (descLen >= 120 && descLen <= 160) {
    descScore = 25;
    descTip = `Optimal description length (${descLen}/160 chars). Maximizes search snippets.`;
  } else if ((descLen >= 80 && descLen < 120) || (descLen > 160 && descLen <= 180)) {
    descScore = 15;
    descTip = `Description is ${descLen} chars. Adjust between 120-160 for optimal search display.`;
  } else if (descLen > 0) {
    descScore = 8;
    descTip = descLen > 180 ? "Description exceeds 180 chars and will get cut off." : "Description is too brief.";
  } else {
    descTip = "Add a Meta Description to encourage shoppers to click your link.";
  }
  checks.push({
    id: "desc_length",
    label: "Meta Description Length",
    passed: descScore >= 20,
    score: descScore,
    maxScore: 25,
    tip: descTip,
  });

  // 4. Actionable Words / Call to Action
  const ctaWords = ["shop", "buy", "collection", "fast", "delivery", "best", "exclusive", "order", "online", "price", "explore", "sale", "কিনুন", "অফার"];
  const hasCta = ctaWords.some((w) => cleanDesc.toLowerCase().includes(w));
  const ctaScore = hasCta ? 10 : cleanDesc.length > 0 ? 4 : 0;
  checks.push({
    id: "action_words",
    label: "Call to Action in Description",
    passed: hasCta,
    score: ctaScore,
    maxScore: 10,
    tip: hasCta ? "Contains persuasive action keywords." : "Include action words like 'Shop', 'Buy', 'Collection', or 'Order Now'.",
  });

  // 5. Clean URL Permalink
  const isSlugValid = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleanSlug);
  let slugScore = 0;
  let slugTip = "Slug should be lowercase letters, numbers, and hyphens only.";
  if (cleanSlug && isSlugValid) {
    slugScore = 10;
    slugTip = `Clean and SEO-friendly permalink /${cleanSlug}.`;
  }
  checks.push({
    id: "slug_quality",
    label: "SEO Friendly URL Slug",
    passed: slugScore === 10,
    score: slugScore,
    maxScore: 10,
    tip: slugTip,
  });

  // 6. On-page Short Description
  const hasShortDesc = shortDesc.trim().length >= 20;
  const shortDescScore = hasShortDesc ? 10 : shortDesc.trim().length > 0 ? 5 : 0;
  checks.push({
    id: "page_content",
    label: "On-Page Category Summary",
    passed: hasShortDesc,
    score: shortDescScore,
    maxScore: 10,
    tip: hasShortDesc ? "Category has introductory description." : "Provide a short description (20+ chars) for on-page SEO.",
  });

  // 7. Visual & FAQ Rich Snippet Data
  let richScore = 0;
  if (bannerImage.trim().length > 0) richScore += 3;
  if (faqsCount > 0) richScore += 2;
  checks.push({
    id: "rich_media",
    label: "Rich Media & Schema FAQ",
    passed: richScore === 5,
    score: richScore,
    maxScore: 5,
    tip:
      richScore === 5
        ? "Banner image and FAQ schema questions are ready."
        : "Add a category banner image and at least 1 FAQ for structured rich snippets.",
  });

  const totalScore = checks.reduce((sum, c) => sum + c.score, 0);

  let rating: SeoAudit["rating"] = "poor";
  let badgeColor = "bg-rose-500/15 text-rose-600 border-rose-300 dark:border-rose-800";

  if (totalScore >= 85) {
    rating = "excellent";
    badgeColor = "bg-emerald-500/15 text-emerald-600 border-emerald-300 dark:border-emerald-800";
  } else if (totalScore >= 70) {
    rating = "good";
    badgeColor = "bg-blue-500/15 text-blue-600 border-blue-300 dark:border-blue-800";
  } else if (totalScore >= 50) {
    rating = "fair";
    badgeColor = "bg-amber-500/15 text-amber-600 border-amber-300 dark:border-amber-800";
  }

  return {
    score: totalScore,
    rating,
    badgeColor,
    checks,
  };
}

export function generateCategoryAiSeo(name: string, countryCode = "bd") {
  const cat = name.trim() || "Fashion Collection";
  const countryName =
    countryCode === "bd"
      ? "Bangladesh"
      : countryCode === "uk"
        ? "UK"
        : countryCode === "us"
          ? "USA"
          : countryCode === "ca"
            ? "Canada"
            : countryCode === "au"
              ? "Australia"
              : "Worldwide";

  const seoTitle = `Buy ${cat} Online in ${countryName} | Faiza Zone`;
  const seoMetaDescription = `Shop exclusive ${cat} collection at Faiza Zone ${countryName}. Trending designs, premium fabrics & best prices with fast home delivery. Order now!`;
  const shortDescription = `Discover the latest trending ${cat} at Faiza Zone. Handcrafted with premium comfort, modern aesthetics, and unbeatable value.`;
  const suggestedFaqs = [
    {
      question: `What styles of ${cat} are available at Faiza Zone?`,
      answer: `We offer a wide variety of ${cat} ranging from daily essentials to festive and formal designs tailored for ${countryName}.`,
    },
    {
      question: `How fast is the delivery for ${cat}?`,
      answer: `Orders in ${countryName} are typically delivered within 2-4 business days with live order tracking and easy returns.`,
    },
  ];

  return {
    seoTitle,
    seoMetaDescription,
    shortDescription,
    suggestedFaqs,
  };
}
