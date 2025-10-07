interface MetadataFormProps {
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

export function MetadataForm({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
}: MetadataFormProps) {
  return (
    <div className="flex flex-col gap-[10px]">
      <input
        id="title"
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        className="w-full text-[15px] border-b border-black focus:outline-none pb-1"
        placeholder="Title"
      />

      <input
        id="description"
        type="text"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        className="w-full text-[15px] border-b border-gray-300 focus:outline-none pb-1"
        placeholder="Description"
      />
    </div>
  );
}
