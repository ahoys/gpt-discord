declare module 'node-pandas' {
  export function DataFrame(dataList: any, columns: any): any;

  export function Series(data: any): any;

  export function readCsv(csvPath: string): any;
}

declare module 'compute-cosine-similarity' {
  export default function compute_cosine_similarity(
    x: number[],
    y: number[],
    accessor?: (d: number, i: number, j: number) => number
  ): number;
}
