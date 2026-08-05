type PreviewRow = Record<
  string,
  string | number | boolean | null
>;

export interface UploadResponse {
  dataset_id: string;
  original_filename: string;
  stored_filename: string;
  rows: number;
  columns: number;
  column_names: string[];

  column_info: {
    name: string;
    datatype: string;
  }[];

  preview: PreviewRow[];
}