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

        # Extract instruction (text in [brackets])
        instruction_match = re.search(r'\[(.*?)\]', q_content)
        instruction = instruction_match.group(0) if instruction_match else ""

        # Clean question text - take everything before the first option
        q_lines = []
        q_text_started = False
        remaining_content = q_content.replace(instruction, "").strip() if instruction else q_content.strip()
        
        for line in remaining_content.split('\n'):
            line = line.strip()
            if not line: continue
            if re.match(r'^\d+\.', line): # Option found
                break
            q_lines.append(line)
        
        q_text = " ".join(q_lines)
        
        # Extract options (lines starting with number followed by dot)
        options = []
        for line in remaining_content.split('\n'):
            line = line.strip()
            if re.match(r'^\d+\.', line):
                opt = re.sub(r'^\d+\.\s*', '', line)
                if opt and "_" not in opt: # skip placeholder lines
                    options.append(opt)

        q_type = "radio"
        if "matrix" in q_content.lower() or "NO\s+MASALAH" in q_content:
            q_type = "matrix"
        elif not options:
            q_type = "text"
        
        questions.append({
            "id": f"q{q_num}",
            "text": q_text,
            "description": instruction,
            "type": q_type,
            "options": options if options else [],
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
