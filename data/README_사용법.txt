로망 길랭표 업데이트 파일

1) index.html과 weekly-data.js를 같은 폴더에 둔 뒤 index.html을 열면 됩니다.
2) 기존 사이트에 올릴 때는 기존 weekly-data.js를 이 파일로 교체하세요.
3) 엑셀을 다시 수정한 뒤 JS를 새로 만들고 싶으면:
   python xlsx_to_weekly_data.py "길랭 (version 1)(2).xlsx" weekly-data.js

참고:
- 현재 JS는 업로드된 엑셀의 13개 시트를 반영합니다.
- 엑셀의 색상은 초록/빨강/노랑/회색/무색으로 변환했습니다.
- 5월 1주차의 날짜 헤더는 엑셀에 적힌 그대로 "4월 31일", "4월 32일", "4월 33일"로 반영했습니다.
