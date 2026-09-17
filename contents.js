function* semvers(start, end) {
  let pieces = start.split('.');
  start = pieces.pop();
  let prefix = pieces.join('.');
  end = end.split('.').pop();
  for (let i = start; i <= end; i++) {
    yield `${prefix}.${i}`;
  }
}
function example(id) { return `exm${id}:Example ${id}`; }
function definition(id, info = null) {
  return `def${id}:Definition ${id}` + (info ? ` - ${info}` : '');
}
function exercise(id) { return `exr${id}:Exercise ${id}`; }
function exercises(range) {
  let ret = [];
  for (let ver of semvers(...range.split('-'))) {
    ret.push(`exr${ver}:Exercise ${ver}`);
  }
  return ret;
}

export default [
  {
    id: "front",
    title: "Front Matter",
    path: "./chapters/redone/0-front.html",
    contents: [
      "frontmatter:Front Matter",
      "preface:Preface",
      "copyright:Copyright",
      "acknowledgements:Acknowledgements",
      "tothestudent:To the Student",
      ["exr0.1:Exercise 0.1"],
      "totheinstructor:To the Instructor", [
        "theiblapproach1:The IBL Approach",
        "theprojects:The Projects",
        "coding:Coding",
        "pacing:Pacing",
        "otherconsiderations:Other Considerations"
      ]
    ]
  }, {
    id: "intro",
    title: "Introduction",
    path: "./chapters/redone/1-intro.html",
    contents: [
      "preliminaries:1 - Preliminary Topics", [
        "1.1:1.1 - What is Numerical Analysis?",
        "1.2:1.2 - Arithmetic in Base 2", [
          ...exercises("1.1-1.10"),
          "exm1.1:Example 1.1",
          ...exercises("1.11-1.12"),
          "exm1.2:Example 1.2",
          ...exercises("1.13-1.16")
        ],
        "1.3", [
          exercise(1.17),
          example(1.3),
          definition(1.1, "Floating Point Precision"),
          definition(1.2, "Machine Precision"),
          exercises("1.18-1.21")
        ],
        "exr1.18",
        "exr1.19",
        "exr1.20",
        "exr1.21",
        "1.4",
        "exr1.22",
        "exr1.23",
        "1.24",
        "exr1.25",
        "exr1.26",
        "fig-taylor-exp1",
        "exr1.27",
        "exr1.28",
        "exr1.29",
        "exr1.30",
        "def1.3",
        "def1.4",
        "exr1.31",
        "exr1.32",
        "exr1.33",
        "exr1.34",
        "fig-taylor-sine-pi2",
        "exr1.35",
        "exr1.36",
        "exr1.37",
        "exm1.4",
        "fig-taylor-3",
        "1.5",
        "exr1.38",
        "theorem1.1",
        "exr1.39",
        "exr1.40",
        "exr1.41",
        "1.6",
        "1.6.1",
        "exr1.42",
        "exr1.43",
        "exr1.44",
        "exr1.45",
        "exr1.46",
        "exr1.47",
        "exr1.48",
        "exr1.49",
        "exr1.50",
        "1.6.2",
        "exr1.51",
        "exr1.52",
        "exr1.53",
        "exr1.54",
        "exr1.55",
        "fnref1",
        "exr1.56",
        "exr1.57",
        "fnref2",
        "exr1.58",
        "ch1refs",
        "refs",
        "ch1footnotes"
      ]
    ]
  }
];
