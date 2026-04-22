import json
import re

def generate_seed():
    with open('docs/extracted_questionnaire.txt', 'r', encoding='utf-8') as f:
        content = f.read()

    # Split into questions based on Q followed by number
    q_blocks = re.split(r'\nQ(\d+)\s*\n', content)
    
    questions = []
    
    # The first element is pre-Q1 text
    for i in range(1, len(q_blocks), 2):
        q_num = q_blocks[i]
        q_content = q_blocks[i+1]
        
        # Extract text and options
        lines = [l.strip() for l in q_content.split('\n') if l.strip()]
        if not lines: continue
        
        # Check for conditional instructions in [brackets] or (parentheses)
        condition_match = re.search(r'\[HANYA DITANYAKAN.*?(Q\d+|“.*?”).*?\]', q_content, re.IGNORECASE)
        conditions = []
        
        if condition_match:
            cond_text = condition_match.group(0)
            # Simple heuristic for common patterns in this PDF
            if "ISLAM" in cond_text.upper():
                conditions.append({"questionId": "q4", "operator": "equals", "value": "Islam"})
            elif "MASIH MUNGKIN BERUBAH" in cond_text.upper():
                conditions.append({"questionId": "q43", "operator": "equals", "value": "Masih mungkin berubah"})
            elif "YA DI Q106" in cond_text.upper():
                conditions.append({"questionId": "q106", "operator": "equals", "value": "Ya"})
            elif "SANGAT SERING" in cond_text.upper() or "CUKUP SERING" in cond_text.upper():
                conditions.append({"questionId": "q97", "operator": "contains", "value": "sering"})
            
            # Party conditions (e.g. Q13, Q14, etc.)
            match_q = re.search(r'DI (Q\d+)', cond_text.upper())
            if match_q:
                q_ref = match_q.group(1).lower()
                for party in ["PKB", "GERINDRA", "PDI PERJUANGAN", "GOLKAR", "NASDEM", "PKS", "DEMOKRAT"]:
                    if party in cond_text.upper():
                        conditions.append({"questionId": q_ref, "operator": "contains", "value": party})

        # Extract instruction (text in [brackets])
        instruction_match = re.search(r'\[(.*?)\]', q_content)
        instruction = instruction_match.group(0) if instruction_match else ""

        # Clean question text - take everything before the first option
        q_lines = []
        q_text_started = False
        remaining_content = q_content.replace(instruction, "").strip() if instruction else q_content.strip()
        
        # Split content into parts to handle multi-line options
        lines = [l.strip() for l in remaining_content.split('\n') if l.strip()]
        
        q_text_lines = []
        options = []
        is_option_mode = False
        current_opt = ""

        for line in lines:
            if re.match(r'^\d+\.', line):
                is_option_mode = True
                if current_opt:
                    options.append(current_opt)
                current_opt = re.sub(r'^\d+\.\s*', '', line).strip()
            elif is_option_mode:
                if current_opt:
                    current_opt += " " + line
                else:
                    current_opt = line
            else:
                q_text_lines.append(line)
        
        if current_opt:
            options.append(current_opt)

        q_text = " ".join(q_text_lines)
        
        # Filter out noise from options
        options = [o for o in options if o and "_" not in o and len(o) > 1]

        # Matrix Detection Heuristic
        q_type = "radio"
        matrix_rows = []
        
        # Specific matrix questions from PDF
        matrix_q_ids = [22, 24, 36, 41, 48, 62, 116]
        if q_num in matrix_q_ids:
            q_type = "matrix"
            # Extract names/labels as rows
            # Look for "1 NAME", "2 NAME", etc.
            matches = re.findall(r'(\d+)\s+([A-Z\s\(\)\'\/]+?)(?=\s+\d+\s+\d+|$)', q_content)
            if matches:
                matrix_rows = [m[1].strip() for m in matches]
                # Filter out headers like "NO NAMA TOKOH"
                matrix_rows = [r for r in matrix_rows if r and not any(h in r for h in ["NAMA TOKOH", "KRITERIA", "MASALAH"])]
            
            # If it's a matrix, options are usually fixed
            if q_num == 22: options = ["Kenal", "Tidak Kenal", "Suka", "Tidak Suka"]
            elif q_num == 24: options = ["Puas", "Tidak Puas"]
            elif q_num == 36: options = ["Ya, Menginginkan", "Tidak Menginginkan"]
            elif q_num == 41: options = ["Ya, Menginginkan", "Tidak Menginginkan"]
            elif q_num == 48: options = ["Penting", "Tidak Penting"]
            elif q_num == 62: options = ["Kenal", "Tidak Kenal", "Suka", "Tidak Suka"]
            elif q_num == 116: options = ["Berhasil", "Tidak Berhasil"]
        elif not options:
            q_type = "text"
        
        # Clean question text if it contains the matrix rows
        for row in matrix_rows:
            q_text = q_text.replace(row, "").strip()
        
        # Clean up question text from "NO NAMA TOKOH" etc
        for header in ["NO NAMA TOKOH", "NO NAMA ANGGOTA DPR RI", "NO KRITERIA", "NO MASALAH"]:
            q_text = q_text.replace(header, "").strip()

        questions.append({
            "id": f"q{q_num}",
            "text": q_text,
            "description": instruction,
            "type": q_type,
            "options": options if options else [],
            "matrixRows": matrix_rows if matrix_rows else None,
            "required": True,
            "conditions": conditions if conditions else []
        })

    questionnaire = {
        "title": "Survei Persepsi Masyarakat Menjelang Pemilu 2024 - Kaltim",
        "description": "Draf kuesioner untuk Daerah Pemilihan Kalimantan Timur.",
        "questions": questions,
        "assigned_surveyors": [],
        "is_active": True
    }

    sql = f"""
-- Full Kaltim Questionnaire Seed
INSERT INTO public.questionnaires (title, description, questions, assigned_surveyors, is_active)
VALUES (
    '{questionnaire['title']}',
    '{questionnaire['description']}',
    '{json.dumps(questionnaire['questions']).replace("'", "''")}'::jsonb,
    '[]'::jsonb,
    true
);
"""
    
    with open('supabase/questionnaires/kaltim_survey_seed.sql', 'w', encoding='utf-8') as f:
        f.write(sql)
    
    print(f"Generated {len(questions)} questions in supabase/questionnaires/kaltim_survey_seed.sql")

if __name__ == "__main__":
    generate_seed()
