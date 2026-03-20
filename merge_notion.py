import os


def split_huge_markdown(input_file, max_size_mb=2):
    """
    按指定大小（默认 2MB）安全地将超大 Markdown 文件切片。
    按行切分，确保不会把一句话或一个单词从中间截断。
    """
    chunk_size_bytes = max_size_mb * 1024 * 1024
    file_count = 1
    current_chunk = ""
    current_size = 0

    # 获取输入文件所在的目录，方便把切片文件存放在同一位置
    base_dir = os.path.dirname(input_file)

    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            for line in f:
                # 计算当前行的字节数（中文字符通常占 3 个字节）
                line_size = len(line.encode('utf-8'))

                # 如果加上这一行超过了单文件上限，就先保存当前文件，开启下一个
                if current_size + line_size > chunk_size_bytes:
                    output_path = os.path.join(base_dir, f"kb_part_{file_count}.md")
                    with open(output_path, 'w', encoding='utf-8') as out_f:
                        out_f.write(current_chunk)

                    print(f"🔪 切片 {file_count} 生成完毕: kb_part_{file_count}.md")

                    file_count += 1
                    current_chunk = line
                    current_size = line_size
                else:
                    current_chunk += line
                    current_size += line_size

            # 把最后剩下的一点尾巴写入最后一个文件
            if current_chunk:
                output_path = os.path.join(base_dir, f"kb_part_{file_count}.md")
                with open(output_path, 'w', encoding='utf-8') as out_f:
                    out_f.write(current_chunk)
                print(f"🔪 切片 {file_count} 生成完毕: kb_part_{file_count}.md")

        print("\n✅ 所有数据切片已完成！现在可以批量上传到 NotebookLM 了。")

    except FileNotFoundError:
        print(f"❌ 找不到文件：{input_file}，请检查路径是否正确。")


# ================= 使用说明 =================
if __name__ == "__main__":
    # 替换为你刚才生成的那个 16MB 文件的绝对路径
    large_file_path = '/Users/chenhelen/Documents/Helen Knowledge Base/my_knowledge_base.md'

    # 执行切片，默认每份 2MB
    split_huge_markdown(large_file_path, 2)