declare module 'compute-cosine-similarity' {
  export default function compute_cosine_similarity(
    x: number[],
    y: number[],
    accessor?: (d: number, i: number, j: number) => number
  ): number;
}
