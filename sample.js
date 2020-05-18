
// 이력서 작업할 때 데이터를 가공하는 유틸리티를 모아놓은 변수
let WriteResumeUtil = (function() {
    let isAllRequired, objectGenerator;

    // 전체 필수로 해야할지 boolean으로 리턴
    isAllRequired = function(...arg) {
        let i, countRequired, countObject;

        countRequired = 0;
        countObject = 0;

        if(arg.length === 1 && arg[0] instanceof Array) {
            for(i=0; i<arg[0].length; i++) {
                if(arg[0][i] instanceof Object) {
                    countObject++;
                    if(arg[0][i].isRequired === true) countRequired++;
                }
            }
        } else {
            for(i in arg) {
                if(arg[i] instanceof Object) {
                    countObject++;
                    if(arg[i].isRequired === true) countRequired++;
                }
            }
        }

        return (countObject === countRequired) ? 'required' : '';
    };

    // Array로 넘어오는 객체를 키 형태의 Object로 변환
    objectGenerator = function(arr) {
        let i, obj = {}, d;

        if(arr && arr.length > 0) {
            for (i = 0; i < arr.length; i++) {
                d = arr[i];
                obj[d.code] = d;
            }
        }

        return obj;
    };

    return {
        isAllRequired : isAllRequired,
        objectGenerator : objectGenerator
    };
})();

let WriteResume = (function() {
    let fn, saveLock, stepListTitle, keyData, fullData, fullDataObject, searchInterval, lengthInterval, stepData, isFinalStep, isFinalOK, mode;
    let isItemLengthMaximized, ResumeItemMap, resumeItemMap;
    let hasAutoScreening; //지원자의 지원분야가 향후 서류작성완료자 자동추가 조건에 해당되는 전형이 존재할 경우, 최종제출 후 지원서 삭제가 불가능하다는 메세지를 표시합니다.

    saveLock = false; // 여러번 저장 못하게 막는 변수

    stepListTitle = ['기본 정보', '교육 및 경험', '자격 및 기타', '자기소개서', '최종제출'];

    keyData = {
        resumeSn : $('input[name="resumeSn"]').val(),
        recruitNoticeSn : $('input[name="recruitNoticeSn"]').val(),
        step : Number($('input[name="step"]').val()) || 1,
        isJobfair : D.bool($('input[name="isJobfairRecruitNotice"]').val()) // 박람회 공고인지 아닌지 체크
    };

    // 글쓰기 or 미리보기
    mode = (keyData.resumeSn !== '0' ? 'write' : 'preview');
    if(mode === 'preview') $('#wrapSessionArea').remove(); // 미리보기일 때 하단 메뉴 지움

    ResumeItemMap = (function() {
        let ResumeItemMap = function(data) {
            let map = {};
            let f = function(data) {
                if(data.items) {
                    (Array.isArray(data.items) ? data.items : Object.keys(data.items).map(function(v) { return data.items[v]; })).reduce(function(acc, value) {
                        acc[value.code] = value;
                        f(value);
                        return acc;
                    }, map);
                }
            };

            f(data);
            this.resumeItemMap = map;
        };

        ResumeItemMap.prototype = {
            getItem(index) { return this.resumeItemMap[index]; }
        };

        return ResumeItemMap;
    })();

    isItemLengthMaximized = function($wrap, $button) {
        let bIsItemLengthMaximized = false;
        let type = $wrap.attr('data-type');
        let code = $button.closest('[data-code]').attr('data-code');
        let item = resumeItemMap.getItem(code);
        let limitLength = item.maxLimitCount;
        let offsetleft, positionLeft;

        if((!item) || item.maxLimitUseYn === false) return false;

        if($wrap.find(`[data-loop="${type}"]`).length >= limitLength) {
            $('#guideTooltip').html(`현재 공고에서는 <strong>최대 ${limitLength || 1}개</strong>까지<br>등록이 가능합니다.`).removeClass('hide');

            $('#guideTooltip').css({
                left : (function() {
                    offsetleft = $button.offset().left - Math.round((($(window).width() > 1180 ? $(window).width() : 1180) - 1180)/2);

                    if(type === 'college') return ($button.width() / 2) - ($('#guideTooltip').width() / 2) + offsetleft;
                    positionLeft = Math.round($('#guideTooltip').width() / 2);

                    return offsetleft - positionLeft - 4;
                })(),
                top : $button.offset().top - 80
            }).removeClass('hide');

            bIsItemLengthMaximized = true;
        }
        return bIsItemLengthMaximized;
    };

    fn = {
        init() {
            isFinalStep = (keyData.step === 5); // 최종제출여부

            fn.load();
            fn.event();
            $('body').linkedForm();
            if(keyData.step === 1) popUp.init('resumeStart'); // popUp.js
        },
        load() {
            let param = {};

            param.resumeSn = keyData.resumeSn;
            param.recruitNoticeSn = keyData.recruitNoticeSn;

            if(!isFinalStep) { // 일반스탭
                param.step = keyData.step;

                $.ajax({
                    type: 'post', dataType: 'json', beforeSend : Common.loading.show(),
                    url: `/mrs2/applicant/resume/step${keyData.step}.json`,
                    data: param,
                    async : false
                }).always(Common.loading.hide).fail(Common.ajaxOnfail)
                    .done(function(x, e) {
                        let nextStep, i;

                        fullData = x['STEP'].items[0].items;
                        stepData = x.stepList;

                        // 다음 스탭이 뭔지 정하는 로직
                        for(i=0; i<stepData.length; i++) {
                            if(stepData[i] === keyData.step) {
                                if(stepData[i] === stepData[stepData.length - 1]) nextStep = 5;
                                else nextStep = stepData[i+1];
                            }
                        }

                        resumeItemMap = new ResumeItemMap(x['STEP'].items[0]);

                        $('head>title').html(`이력서 작성 | ${x.recruitNoticeName}`);
                        $('#frm').attr('data-step', nextStep).attr('data-type', 'save');
                        $('#header').html(fn.templateHeader(x));
                        $('#wrapResume').html(fn.template());
                        $('#wrapResume .limitLength').each(function() { // 현재 글자수 - entity code가 decode되기 전의 글자수로 불러오던 문제 해결위해 넣은 코드
                            let length = $(this).siblings('textarea').text().length;
                            $(this).find('b').text(length);
                        });
                        $('#wrapSessionArea').html(fn.loadTemplateFooter(nextStep));

                        Dates.add('foreignExamCriteriaDate', { min: D.date(x.foreignExamCriteriaDate, 'yyyy/MM/dd')}); // 공인 외국어 시험 인정일
                        Dates.add('graduationCriteriaDate', { max: D.date(x.graduationCriteriaDate, 'yyyy/MM/dd')}); // 학교 졸업 인정일
                        Dates.add('forbiddenAfterToday', { max: D.date(new Date(), 'yyyy/MM/dd')});

                        WriteResumeTimer.init(x.receiveStartDatetime, x.receiveEndDatetime); // 접수기간
                    });
            } else { // 최종제출
                $.ajax({
                    type: 'post', dataType: 'json', beforeSend : Common.loading.show(),
                    url: '/mrs2/applicant/resume/step5.json',
                    data: param,
                    async : false
                }).always(Common.loading.hide).fail(Common.ajaxOnfail)
                    .done(function(x) {
                        fullData = x;
                        stepData = x.stepList;
                        hasAutoScreening = x.hasAutoScreening;

                        $('head>title').html(`이력서 최종제출 | ${x.recruitNoticeName}`);
                        $('#header').html(fn.templateHeader(x));
                        $('#wrapResume').html(fn.templateFinal());
                        $('#wrapSessionArea').html(fn.loadTemplateFooter());

                        Timeline.init('#applicantTimeline', {graphViewList : x.summaryGraph, showData : x.showData}); // timeline 실행
                        WriteResumeTimer.init(x.receiveStartDatetime, x.receiveEndDatetime); // 접수기간
                    });
            }
        },
        templateHeader(d) {
            let i, t = [];

            t.push(`<h1 class="recruitNoticeTitle">${d.recruitNoticeName}</h1>`);
            if(d.recruitNoticeGuide) t.push(`<p class="recruitNoticeDesc">${d.recruitNoticeGuide}</p>`);

            if(stepData.length > 2) { // 스탭 1과 최종제출만 있을 때는 안나온다.
                t.push('<nav id="tab">');
                for(i=0; i<stepData.length; i++) {
                    t.push(`<div class="${keyData.step === stepData[i] ? 'active' : ''}">`);
                    if(mode === 'write' && keyData.step < 5) t.push(`<button type="submit" data-step="${stepData[i]}">${stepListTitle[stepData[i]-1]}</button>`);
                    else t.push(`<button type="button" data-type="tempSave" data-step="${stepData[i]}">${stepListTitle[stepData[i]-1]}</button>`);
                    t.push('</div>');
                }
                t.push('</nav>');
            }

            return t.join('');
        },
        // 기본정보/인적사항/학력사항 등의 대단위 템플릿
        template() {
            let i, len, d, t = [];

            if(keyData.step === 1) fn.updateStep1Data(); // 기본정보&인적사항은 목록고정형이라 array에서 object로 데이터를 가공한다.
            else if(keyData.step === 2) fn.updateStep2Data(); // 고등학교/대학교 등을 겉으로 빼기 위해 데이터를 가공한다.
            else if(keyData.step === 3) fn.updateStep3Data(); // 간단한 데이터 몇 개를 수정한다.
            else if(keyData.step === 4) fn.updateStep4Data(); // '자소서역량기술서' 로 되어있는 것을 자기소개서, 역량기술서로 분리한다.
            fullDataObject = WriteResumeUtil.objectGenerator(fullData); // 가공된 데이터를 Array에서 Object형태로 변경(데이터를 추가할 때 필요함)
            for(i=0, len=fullData.length; i<len; i++) {
                d = fullData[i];
                if((d.items && Object.keys(d.items).length) || d.builder) { // items는 일반적인 항목, builder는 자기소개서/역량기술서
                    t.push(`<section class="writeResume" data-code="${d.code}">`);
                    t.push('	<header>');
                    t.push(`		<h1 class="h1">${d.codeName}</h1>`);
                    t.push('	</header>');
                    t.push(fn.loadTemplate(d)); // 코드를 보고 그에 맞는 템플릿을 호출한다.
                    t.push('</section>');
                }
            }

            return t.join('');
        },
        templateFinalSVG(i) { //스킨 작업을 위해서 SVG로 만듬
            switch(i) {
                case 1 : return '<svg style="position:relative; top:24px; left:1px;" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="85" height="89" viewBox="0 0 369 419"><image overflow="visible" width="82" height="93" xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFIAAABdCAYAAAA2ejFOAAAACXBIWXMAAAJ1AAACdQF32cIiAAAA GXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAo9JREFUeNrs3T9rFEEYx/GdyXG5 oCIhFuobEEsxr8RKrGwSSApJJ74RLQQRLLTMu0gnsZOkFm1MDOTP3p+9cc6bXZ5sntm75CyOm+8P hhuWY4sPz87OXTFPlhEyTzHTfrG1vGxSBBp0u25myKFzz/0XNvz0qR93E7E78uOr13vX7nR2wzU3 CdXEqq+f5x/89GXKj6tXe+sxXwnMKKjVEHt5/iJ1xFBl2yfHf54FJ1MWnrbM2cgNXvP6GGdlpbMT nKwAzRohg/RoPIKwKqrHIxo/lkRVmnpVtiLrZhvCKkvCqVwbh2KuQhrcopiuBmgkplX2iWDqkLbp pWNn2aQn9KPFapBNb20Q9UhA9cmlIm/2c3q6fSSJIpqp9pHk5v9LAPkfF1ECJJBAEiCBBBJIAiSQ QBIggQQSSAIkkEACSYAEEkgCJJBAAkmABBJIIAmQQAJJgAQSSCAJkEACCSQBEkggCZBAAgkkARJI IAmQQAIJJAESSCCBJEDOK+QFNFWKWSC/4zdOt9c7DFN3bcjT07P3EI5zeHDwSSC6GKgG6VbvrX3s 9QdfUkf8fXT8+cn6+q5SkRN7NVTyt+7c3vzx89eWB91LbU08v8j39ve/7dx/+OBNNj57fCiq0WmY 1XGnor3ACLc8Db4dPssj9uUx+4ucEqwIY+BHP4xBuPYPt+wkUp2MP7oQMF3tRnW4VCDLSiwEnKzM S+1YWsoNjLhRIdDKazZRyCK73GKgsVeDvIlRrlmxrpoFRswEpMSs92u4ukZG1sr60fo2sTVyKJY4 WaWu3mWpNaG0Xa1CTWKQTkFV95HRnl/KiyXap2CBH2+nzbWeX40gkdYsqfRyuLIBv3YXugmoSWXa voiEzFf+CjAA197PmvwFWw4AAAAASUVORK5CYII=" transform="scale(4.5)"/><path class="iconStepFinalColor1" fill-rule="evenodd" clip-rule="evenodd" fill="#F7EC21" d="M143.229 144.875c-.828-1.512-4.88-8.372-4.88-8.372-.264-.448-.402-.962-.402-1.564 0-11.61-8.461-21.19-19.681-22.289-6.262-.602-12.421 1.424-16.891 5.585-4.331 4.03-6.736 9.598-6.787 15.688-.191 1.811-.824 12.16 7.943 24.798 2.415 3.88.65 10.314-.231 12.463-.389.949-.29 2.035.264 2.887.556.857 1.49 1.371 2.494 1.371h18.686c1.65 0 2.993-1.371 2.993-3.063v-4.588h3.34c4.342 0 7.87-3.612 7.87-8.055v-7.251h1.211c1.707 0 3.239-.892 4.098-2.395.904-1.577.893-3.528-.027-5.215z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#333" d="M306.888 13.434h-262.903c-11.865 0-21.52 9.65-21.52 21.507v312.428c0 11.861 9.655 21.508 21.52 21.508h262.903c11.865 0 21.518-9.646 21.518-21.508v-312.428c-.001-11.857-9.653-21.507-21.518-21.507zm14.723 333.935c0 8.117-6.607 14.719-14.724 14.719h-262.902c-8.119 0-14.724-6.602-14.724-14.719v-312.428c0-8.112 6.605-14.713 14.724-14.713h262.903c8.116 0 14.724 6.601 14.724 14.713v312.428zm-159.752-295.448h36.244c1.874 0 3.395-1.521 3.395-3.397 0-1.872-1.521-3.393-3.395-3.393h-36.244c-1.876 0-3.397 1.521-3.397 3.393 0 1.877 1.521 3.397 3.397 3.397zm-44.257 158.102c36.009 0 65.307-29.285 65.307-65.276 0-35.996-29.298-65.281-65.307-65.281-36.013 0-65.312 29.285-65.312 65.281.001 35.991 29.299 65.276 65.312 65.276zm0-123.763c32.262 0 58.513 26.235 58.513 58.487 0 32.247-26.251 58.482-58.513 58.482-32.267 0-58.518-26.235-58.518-58.482 0-32.251 26.251-58.487 58.518-58.487zm-16.477 87.988c-.439 1.05-.328 2.254.303 3.199.629.949 1.69 1.521 2.826 1.521h21.208c1.874 0 3.399-1.521 3.399-3.397v-5.08h3.791c4.926 0 8.93-4.008 8.93-8.925v-8.033h1.375c1.938 0 3.679-.993 4.652-2.65 1.026-1.753 1.015-3.911-.029-5.779l-.002-.004c-.938-1.674-5.539-9.277-5.539-9.277-.299-.492-.457-1.059-.457-1.731 0-12.863-9.6-23.476-22.335-24.693-7.108-.668-14.098 1.578-19.169 6.188-4.916 4.465-7.644 10.63-7.702 17.385-.22 2.004-.936 13.465 9.014 27.466 2.738 4.304.739 11.428-.265 13.81zm-1.993-40.562c.024-.167.037-.334.037-.505 0-4.896 1.947-9.36 5.48-12.568 3.711-3.375 8.677-4.953 13.95-4.452 9.229.879 16.188 8.587 16.188 18.018 0 1.815.492 3.59 1.433 5.15.002.004 2.814 4.654 4.449 7.414h-.895c-2.746 0-4.987 2.237-4.987 4.983v9.839c0 1.173-.956 2.131-2.136 2.131h-4.639c-3.28 0-5.948 2.667-5.948 5.946v2.536h-13.231c.936-4.201 1.441-10.433-1.809-15.53-9.131-12.859-7.903-22.887-7.892-22.962zm107.562 43.049h83.584c1.874 0 3.397-1.521 3.397-3.397s-1.523-3.393-3.397-3.393h-83.584c-1.876 0-3.399 1.516-3.399 3.393s1.523 3.397 3.399 3.397zm-146.948 71.37h232.701c1.874 0 3.399-1.52 3.399-3.396 0-1.871-1.525-3.396-3.399-3.396h-232.701c-1.877 0-3.399 1.525-3.399 3.396 0 1.877 1.522 3.396 3.399 3.396zm233.172 28.649h-232.7c-1.876 0-3.397 1.521-3.397 3.396 0 1.873 1.521 3.398 3.397 3.398h232.7c1.876 0 3.398-1.525 3.398-3.398 0-1.875-1.522-3.396-3.398-3.396zm0 34.309h-232.7c-1.876 0-3.397 1.52-3.397 3.396s1.521 3.396 3.397 3.396h232.7c1.876 0 3.398-1.52 3.398-3.396s-1.522-3.396-3.398-3.396zm-86.224-98.328h83.584c1.874 0 3.397-1.52 3.397-3.397 0-1.877-1.523-3.396-3.397-3.396h-83.584c-1.876 0-3.399 1.52-3.399 3.396 0 1.877 1.523 3.397 3.399 3.397z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#11B5BB" class="iconStepFinalColor2" d="M211.911 107.064c-1.276-1.375-3.424-1.459-4.804-.189-1.377 1.274-1.463 3.423-.188 4.803l8.698 9.404-9.999 11.193c-1.251 1.402-1.128 3.551.272 4.799.648.576 1.454.861 2.261.861.937 0 1.865-.382 2.538-1.134l12.052-13.5c1.167-1.305 1.149-3.278-.04-4.566l-10.79-11.671zm23.263 0c-1.275-1.375-3.428-1.459-4.802-.189-1.378 1.274-1.463 3.423-.188 4.799l8.694 9.409-9.997 11.193c-1.251 1.402-1.13 3.551.27 4.799.648.576 1.457.861 2.262.861.938 0 1.869-.382 2.537-1.134l12.055-13.5c1.164-1.301 1.148-3.278-.04-4.566l-10.791-11.672zm21.447 0c-1.274-1.375-3.422-1.459-4.801-.189-1.376 1.274-1.464 3.423-.189 4.799l8.697 9.409-9.998 11.193c-1.252 1.402-1.132 3.551.271 4.799.647.576 1.454.861 2.259.861.936 0 1.867-.382 2.54-1.134l12.052-13.5c1.164-1.301 1.146-3.278-.039-4.566l-10.792-11.672zm32.803 11.672l-10.791-11.672c-1.276-1.375-3.426-1.459-4.803-.189-1.378 1.274-1.461 3.423-.188 4.803l8.697 9.404-10 11.193c-1.25 1.402-1.129 3.551.271 4.799.648.576 1.457.861 2.261.861.937 0 1.865-.382 2.54-1.134l12.055-13.5c1.164-1.3 1.146-3.278-.042-4.565z"/></svg>';
                case 2 : return '<svg style="position:relative; top:27px; left:2px;" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="111" height="74" viewBox="0 0 531 347"><image overflow="visible" width="118" height="77" xlink:href="data:image/png;base64,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 AABJRU5ErkJggg==" transform="scale(4.5)"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#11B5BB" class="iconStepFinalColor2" d="M157.5 319.5h-40.5l9 13.5h26.996l9.004-9v-9z"/><path class="iconStepFinalColor1" fill-rule="evenodd" clip-rule="evenodd" fill="#F7EC21" d="M45 234c-12.428 0-22.5 10.072-22.5 22.5s10.072 22.5 22.5 22.5c12.423 0 22.5-10.072 22.5-22.5s-10.077-22.5-22.5-22.5z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#F0EFEF" d="M265.5 243l85.496-40.5v-81l-85.496 36v85.5zm-94.5-130.5l36 18 58.5-54-94.5 36zm184.496 58.5v27l40.5-27h-40.5z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#333" d="M490.496 283.519l4.504-.019-4.504-5.216v-1.323h-1.143l-95.555-110.659h-39.058v-43.264l94.49-38.667-184.249-75.402-184.253 75.402 75.753 30.999v40.047c-3.063-4.258-8.038-7.066-13.68-7.066-3.938 0-7.515 1.411-10.389 3.674l-.013-.119-105.219 87.411.004.03c-5.612 4.738-9.189 11.805-9.189 19.697 0 13.561 10.547 24.692 23.884 25.703l.105.102h11.984v23.356h101.798c-.522 2.731-1.383 5.369-2.772 6.794h-35.994l7.497 17.996h27.11c7.058 0 11.619-4.698 11.619-11.967v-12.823h327.27v-24.686zm-337.5 44.981h-22.496l-4.5-9h22.5c1.986 0 4.333.215 9 0 0 5.234-3.164 9-4.504 9zm238.016-155.465l91.152 103.926h-318.938v-103.834l11.808-.009v18.716l-.009-.004v7.497l90.532 43.945 82.437-38.86v.013l6.746-3.134v-28.248l36.272-.008zm-227.786-6.733v-48.173l11.808 4.83v43.343h-11.808zm18.549 28.806v-69.39l83.206 34.049 83.013-33.97v71.161l-82.556 38.75-83.663-40.6zm-83.267-110.737l166.474-68.128 166.47 68.128-166.47 68.124-94.382-38.624 86.058-32.098c1.859 1.024 4.188 1.644 6.82 1.644 6.302 0 11.061-3.41 11.061-7.932 0-4.518-4.759-7.923-11.061-7.923s-11.052 3.406-11.052 7.923c0 .224.062.431.083.65l-91.099 33.974-62.902-25.738zm160.624-8.684c.215-.409 1.771-1.397 4.346-1.397 2.219 0 3.683.729 4.184 1.195-.501.47-1.964 1.2-4.184 1.2-2.575 0-4.13-.989-4.346-.998zm-103.689 100.507l.848-.914-.048-.048.237-.379v102.107h-94.076c.288-.295.572-.593.846-.9h.004l91.112-98.697c.387-.365.73-.769 1.077-1.169zm-29.439-10.322l.013.114 9.264-7.664c1.547-1.173 4.535-3.239 7.519-3.239 5.577 0 10.116 4.531 10.116 10.099 0 3.713-.729 4.729-3.296 7.502l-.185.158-7.831 9.048h.031l-71.96 78.003c.009-.281.04-.563.04-.848 0-13.944-11.149-25.313-25.022-25.762l81.311-67.411zm-101.263 93.173c0-10.512 8.574-19.072 19.116-19.072 10.538 0 19.112 8.561 19.112 19.072 0 10.516-8.574 19.072-19.112 19.072-10.542 0-19.116-8.556-19.116-19.072zm35.961 25.805h95.779v16.413h-95.779v-16.413zm423.062 16.413h-320.534c.017-.814 0-1.403-.004-1.647v-14.766l232.386-.945h88.151v17.358z"/></svg>';
                case 3 : return '<svg style="position:relative; top:27px; left:13px;" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="97" height="80" viewBox="0 0 468 410"><image overflow="visible" width="104" height="91" xlink:href="data:image/png;base64,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 /wIMAL/tlcWdxz7dAAAAAElFTkSuQmCC" transform="scale(4.5)"/><path fill-rule="evenodd" clip-rule="evenodd" class="iconStepFinalColor2" fill="#11B5BB" d="M339.938 121.848c.972-.813 1.582-1.262 1.898-1.503.615.404 1.806 1.243 4.065 2.971 3.893 2.962 5.655 4.377 6.451 5.045-.193.615-.611 1.762-1.525 3.818-.734 1.64-.519 3.313.602 4.602.488.545 1.564 1.6 5.349 4.491 4.101 3.124 5.313 3.81 5.989 4.096.497.188.967.276 1.398.276 1.085 0 1.924-.549 2.408-1.182v-.009c.408-.541.83-1.095 7.624-24.368 4.487-15.416 6.956-24.231 7.55-26.978.453-2.188-.343-3.331-1.107-3.925-.514-.391-1.322-.944-2.412-1.67-.984-.654-1.723-1.16-2.207-1.529-.492-.378-1.203-.993-2.135-1.841-1.064-.976-1.868-1.661-2.418-2.083-.795-.598-2.17-1.011-4.223.448-.928.659-5.717 3.814-23.256 15.091-20.03 12.911-20.435 13.447-20.816 13.957l-.633 1.063.127.909c.158 1.2.993 2.501 4.632 5.278 5.032 3.832 6.403 4.653 7.124 4.97 1.886.792 3.858-.53 5.515-1.927zm19.64-14.367c.355-.246.693-.475 1.015-.686l-.308.84c-.896 2.452-1.473 3.858-1.779 4.614l-.229-.167c-1.086-.826-1.908-1.468-2.492-1.96.747-.553 1.93-1.388 3.793-2.641zm15.469 131.889c-1.64-.668-3.239-.949-4.914-.87-.074-1.199-.246-2.329-.514-3.375-.492-1.89-1.301-3.44-2.399-4.609-3.797-4.039-8.003-5.604-12.538-4.663-3.203.686-6.807 2.817-11.017 6.518-.853.756-3.722 3.44-8.604 8.06-4.135 3.915-5.045 4.882-5.396 5.3-1.45 1.797-.918 3.419.29 4.548 2.461 2.382 4.307 4.175 5.52 5.375 4.746 4.685 7.94 7.905 9.598 9.668 1.477 1.564 3.639 4.052 6.618 7.611 2.957 3.533 5.212 6.13 6.764 7.778.637.677 1.449 1.02 2.289 1.02.611 0 1.239-.181 1.824-.55.914-.549 3.019-2.127 10.713-9.417l3.292-3.072c5.444-5.15 8.204-10.116 8.204-14.739.014-4.082-1.516-7.787-4.543-11.017-1.483-1.58-3.232-2.779-5.187-3.566zm-19.754 4.122c-.176.589-.738 1.622-2.408 3.199-.747.712-1.279 1.187-1.644 1.508-.269-.246-.62-.594-1.081-1.086-.242-.255-.584-.668-1.011-1.208l-.153-.207c.219-.232.51-.519.883-.87 1.969-1.863 2.953-2.482 3.344-2.672.924-.439 1.323-.268 1.824.26h.004c.326.355.383.606.242 1.076zm12.902 12.788c-.137.29-.672 1.165-2.615 3.006-.904.857-1.533 1.411-1.955 1.763-.348-.33-.844-.822-1.529-1.552-.563-.598-.967-1.046-1.248-1.38.383-.391.94-.949 1.754-1.723 1.854-1.753 2.83-2.28 3.234-2.435.514-.193 1.063-.303 1.92.606.769.819.646 1.272.439 1.715zm56.553-65.175c-2.109-3.19-2.707-3.969-3.023-4.32-.816-.909-1.7-1.099-2.303-1.099-.949 0-1.524.457-3.031 1.767-1.012.857-1.982 1.517-2.893 1.965-1.389.677-2.813 1.006-4.35 1.006-2.461 0-4.373-.909-5.832-2.777-1.438-1.828-2.141-4.078-2.141-6.873 0-2.746.699-4.961 2.132-6.768 1.459-1.832 3.37-2.725 5.841-2.725 1.484 0 2.883.348 4.267 1.051.944.487 1.938 1.199 2.966 2.113 1.552 1.385 2.141 1.863 3.104 1.863.852 0 1.643-.325 2.092-.786.452-.383 1.08-1.086 3.33-5.054 2.36-4.166 2.541-4.953 2.541-5.683 0-.944-.414-1.876-1.24-2.799-4.39-4.755-10.467-7.177-18.061-7.177-7.071 0-12.973 2.689-17.557 7.977-4.328 4.987-6.525 11.113-6.525 18.211 0 7.339 2.254 13.521 6.692 18.382 4.597 5.067 10.657 7.638 18 7.638 7.237 0 13.131-2.658 17.548-7.94.505-.629 1.178-1.6 1.178-2.773-.001-.778-.124-1.217-2.735-5.199z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#F7EC21" class="iconStepFinalColor1" d="M211.064 111.978c-1.174-3.437-4.391-5.656-8.188-5.656l-26.727-.088-8.223-24.056c-1.169-3.44-4.386-5.664-8.188-5.664-3.797 0-7.018 2.224-8.187 5.664l-8.35 24.144h-26.601c-3.797 0-7.009 2.22-8.187 5.656-1.178 3.44.048 7.031 3.124 9.158l21.573 15.016-8.222 24.061c-1.178 3.437.048 7.031 3.129 9.158 1.537 1.063 3.295 1.591 5.058 1.591s3.524-.527 5.058-1.596l21.684-14.871 21.52 14.871c3.08 2.132 7.049 2.127 10.121.005 3.08-2.127 4.307-5.722 3.129-9.158l-8.17-24.205 21.529-14.871c3.07-2.128 4.296-5.719 3.118-9.159z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#333" d="M268.479 13.5h-223.057c-12.674 0-22.979 10.345-22.979 23.063v300.375c0 12.718 10.306 23.063 22.979 23.063h223.057c12.67 0 22.979-10.345 22.979-23.063v-300.375c0-12.718-10.31-23.063-22.979-23.063zm16.251 323.438c0 8.996-7.291 16.313-16.252 16.313h-223.056c-8.965 0-16.256-7.316-16.256-16.313v-300.375c0-8.995 7.291-16.313 16.256-16.313h223.057c8.961 0 16.252 7.317 16.252 16.313v300.375zm-177.447-213.93l23.458 17.147-8.938 27.492c-1.279 3.924.053 8.033 3.406 10.463 1.67 1.209 3.586 1.815 5.502 1.815 1.911 0 3.827-.606 5.497-1.824l23.581-16.984 23.405 16.984c3.353 2.439 7.669 2.431 11.009.009 3.348-2.43 4.68-6.539 3.4-10.463l-8.885-27.65 23.414-16.989c3.335-2.431 4.671-6.53 3.393-10.459-1.279-3.929-4.777-6.469-8.908-6.469l-29.065-.097-8.943-27.483c-1.275-3.929-4.773-6.465-8.904-6.465s-7.633 2.536-8.907 6.465l-9.079 27.58h-28.93c-4.131 0-7.624 2.54-8.902 6.469-1.28 3.929.052 8.028 3.396 10.459zm32.322-8.838c4.535 0 8.525-2.9 9.918-7.225l10.217-30.818.049.109 9.953 30.709c1.398 4.324 5.393 7.225 9.924 7.225l32.326.295-26.073 18.979c-3.669 2.668-5.194 7.365-3.792 11.686l9.711 30.894-26.063-18.98c-1.837-1.34-3.99-2.008-6.14-2.008-2.152 0-4.297.668-6.125 2.008l-26.324 18.8 9.959-30.713c1.406-4.32-.119-9.018-3.793-11.686l-25.967-19.274h32.22zm90.827 101.83h-150.905c-1.859 0-3.361 1.512-3.361 3.375s1.502 3.375 3.361 3.375h150.904c1.858 0 3.365-1.512 3.365-3.375s-1.506-3.375-3.364-3.375zm0 25.875h-150.905c-1.859 0-3.361 1.512-3.361 3.375s1.502 3.375 3.361 3.375h150.904c1.858 0 3.365-1.512 3.365-3.375s-1.506-3.375-3.364-3.375zm0 25.875h-150.905c-1.859 0-3.361 1.512-3.361 3.375s1.502 3.375 3.361 3.375h150.904c1.858 0 3.365-1.512 3.365-3.375s-1.506-3.375-3.364-3.375zm0 25.875h-150.905c-1.859 0-3.361 1.512-3.361 3.375s1.502 3.375 3.361 3.375h150.904c1.858 0 3.365-1.512 3.365-3.375s-1.506-3.375-3.364-3.375zm122.211-180.364c.572.505 1.564 1.296 2.958 2.351.8.615 2.122 1.626 3.524 1.626.439 0 .888-.101 1.332-.352.452-.259.769-.615 1.023-.94.457-.61 1.164-1.894 2.953-6.789 1.727-4.746 2.096-6.319 2.224-7.089l.729-4.403-3.938 2.074c-1.143.598-3.283 1.969-6.35 4.065-4.795 3.217-5.625 4.047-6.029 4.579-.768 1.014-1.111 2.698 1.574 4.878zm6.93-5.78c.356-.246.694-.475 1.011-.686l-.303.84c-.896 2.452-1.473 3.858-1.78 4.614l-.229-.167c-1.085-.826-1.907-1.468-2.487-1.96.742-.553 1.92-1.388 3.788-2.641zm-19.639 14.367c.972-.813 1.582-1.262 1.898-1.503.615.404 1.803 1.243 4.065 2.971 3.894 2.962 5.655 4.377 6.451 5.045-.193.615-.61 1.762-1.524 3.818-.734 1.64-.52 3.313.602 4.602.483.545 1.564 1.6 5.348 4.491 4.101 3.124 5.313 3.81 5.99 4.096.496.188.967.276 1.397.276 1.085 0 1.925-.549 2.408-1.182v-.009c.409-.541.831-1.095 7.62-24.368 4.491-15.416 6.961-24.231 7.555-26.978.447-2.188-.344-3.331-1.107-3.925-.515-.391-1.323-.944-2.413-1.67-.984-.654-1.723-1.16-2.206-1.529-.492-.378-1.204-.993-2.136-1.841-1.063-.976-1.863-1.661-2.417-2.083-.795-.598-2.171-1.011-4.223.448-.928.659-5.718 3.814-23.256 15.091-20.026 12.911-20.436 13.447-20.822 13.957l-.628 1.063.128.909c.158 1.2.992 2.501 4.631 5.278 5.032 3.832 6.398 4.653 7.119 4.97 1.891.792 3.863-.53 5.52-1.927zm-12.12-8.35c2.057-1.424 7.004-4.72 18.558-12.164 12.999-8.358 20.707-13.355 23.247-15.064.365.316.791.703 1.287 1.151 1.06.967 1.873 1.661 2.431 2.087.54.413 1.358.98 2.452 1.705.65.436 1.187.796 1.608 1.095-.615 2.751-3.054 11.438-7.444 26.534-4.008 13.729-5.783 19.459-6.557 21.779-.725-.488-1.938-1.358-3.946-2.888-3.38-2.57-4.407-3.551-4.593-3.744 2.207-4.979 2.348-6.258 1.75-7.541-.304-.545-.523-.94-8.033-6.671-4.861-3.704-5.713-4.091-6.676-4.091l-.229.004c-.914.097-1.99.594-4.574 2.756-.673.566-1.117.856-1.376 1.006-.663-.422-2.21-1.485-5.748-4.184-1.019-.773-1.7-1.348-2.157-1.77zm40.614 138.656c-1.477.563-3.217 1.802-5.321 3.788-3.634 3.423-4.038 4.184-4.14 5.186-.154 1.357.471 2.373 3.357 5.436 2.816 2.997 3.955 3.819 5.322 3.837 1.16 0 2.21-.541 5.73-3.858 2.122-2.004 3.405-3.551 4.047-4.887 1.222-2.619.734-5.305-1.38-7.555-2.148-2.281-4.833-2.966-7.615-1.947zm4.429 7.334c-.153.325-.751 1.31-2.939 3.375-1.02.963-1.727 1.587-2.197 1.978-.396-.369-.953-.923-1.727-1.74-.629-.672-1.086-1.173-1.406-1.551.43-.439 1.063-1.063 1.977-1.934 2.088-1.969 3.187-2.563 3.639-2.733.58-.216 1.195-.339 2.162.681.865.918.73 1.428.491 1.924zm7.717-18.984c-1.846-.751-3.646-1.067-5.532-.979-.083-1.345-.276-2.615-.575-3.788-.559-2.123-1.469-3.863-2.707-5.177-4.271-4.535-9.005-6.284-14.111-5.234-3.607.77-7.664 3.164-12.396 7.317-.963.848-4.193 3.862-9.686 9.048-4.658 4.395-5.683 5.48-6.078 5.95-1.631 2.021-1.033 3.841.325 5.106 2.772 2.677 4.847 4.689 6.214 6.038 5.344 5.256 8.943 8.877 10.802 10.854 1.661 1.754 4.101 4.549 7.453 8.543 3.327 3.969 5.866 6.887 7.611 8.736.721.761 1.63 1.143 2.575 1.143.689 0 1.397-.202 2.057-.615 1.023-.615 3.396-2.391 12.059-10.573l3.705-3.449c6.13-5.783 9.236-11.355 9.236-16.55.014-4.584-1.705-8.745-5.115-12.371-1.671-1.771-3.635-3.115-5.837-3.999zm-1.748 29.241l-3.691 3.445c-6.21 5.862-9.07 8.319-10.406 9.352-1.645-1.797-3.837-4.333-6.584-7.603-3.418-4.078-5.914-6.943-7.642-8.767-1.886-2.004-5.524-5.665-10.938-10.991-1.213-1.204-3.001-2.936-5.348-5.194.765-.765 2.184-2.145 4.808-4.618 5.427-5.124 8.613-8.1 9.558-8.935 4.008-3.516 7.41-5.59 10.107-6.165 3.292-.694 6.368.536 9.4 3.757.654.694 1.187 1.371 1.521 2.646.264 1.028.321 1.508.36 2.769.088 1.218-.58 1.745-.598 2.61-.031 1.485 1.877 2.712 1.877 2.712.887.769 2.311.118 3.066-.058 1.328-.325 2.756-.171 4.373.483 1.525.611 2.883 1.547 4.043 2.777 2.531 2.689 3.758 5.599 3.744 8.899.001 3.754-2.57 8.091-7.65 12.881zm-15.658-23.15c.682-2.254.176-4.434-1.438-6.135-2.148-2.298-4.961-2.79-7.91-1.384-1.301.637-2.948 1.907-5.035 3.88-1.047.984-1.785 1.771-2.232 2.338-1.758 2.229-.766 3.727-.246 4.271.268.281.641.738 1.146 1.389.624.787 1.107 1.371 1.441 1.719 1.982 2.109 3.401 3.282 4.834 3.282l.343-.018c1.055-.079 1.886-.58 5.019-3.533 2.188-2.069 3.524-3.964 4.078-5.809zm-4.83-1.463c-.201.659-.83 1.819-2.711 3.59-.84.8-1.438 1.332-1.85 1.692-.304-.277-.695-.664-1.218-1.218-.272-.285-.655-.751-1.134-1.357l-.18-.229c.254-.264.58-.585.997-.98 2.22-2.092 3.327-2.786 3.767-3.001 1.037-.492 1.489-.299 2.052.294h.005c.37.4.43.681.272 1.209zm66.406-54.027c-2.113-3.19-2.707-3.969-3.023-4.32-.817-.909-1.701-1.099-2.303-1.099-.949 0-1.525.457-3.032 1.767-1.011.857-1.981 1.517-2.892 1.965-1.389.677-2.813 1.006-4.351 1.006-2.461 0-4.372-.909-5.831-2.777-1.438-1.828-2.141-4.078-2.141-6.873 0-2.746.699-4.961 2.131-6.768 1.459-1.832 3.371-2.725 5.841-2.725 1.481 0 2.883.348 4.267 1.051.945.487 1.943 1.199 2.967 2.113 1.551 1.385 2.141 1.863 3.103 1.863.853 0 1.644-.325 2.092-.786.452-.383 1.077-1.086 3.335-5.054 2.355-4.166 2.531-4.953 2.531-5.683 0-.944-.408-1.876-1.238-2.799-4.387-4.755-10.464-7.177-18.058-7.177-7.071 0-12.978 2.689-17.556 7.977-4.329 4.987-6.531 11.113-6.531 18.211 0 7.339 2.26 13.521 6.697 18.382 4.598 5.067 10.657 7.638 18 7.638 7.238 0 13.131-2.658 17.548-7.94.505-.629 1.178-1.6 1.178-2.773 0-.778-.128-1.217-2.734-5.199zm-15.992 11.413c-6.117 0-10.92-2.017-14.695-6.174-3.713-4.065-5.515-9.084-5.515-15.346 0-6.064 1.771-11.053 5.423-15.254 3.748-4.328 8.385-6.429 14.177-6.429 6.228 0 10.978 1.784 14.638 5.62-.25.523-.751 1.508-1.771 3.305-.765 1.345-1.296 2.237-1.67 2.826-1.296-1.156-2.597-2.074-3.885-2.742-2.017-1.024-4.14-1.543-6.311-1.543-3.867 0-7.009 1.485-9.352 4.417-2.057 2.602-3.103 5.822-3.103 9.575 0 3.793 1.041 7.04 3.094 9.655 2.342 2.983 5.488 4.495 9.36 4.495 2.206 0 4.329-.492 6.319-1.463 1.217-.598 2.475-1.441 3.758-2.522.391.566.962 1.406 1.779 2.646.923 1.41 1.45 2.25 1.74 2.746-3.531 4.162-8.105 6.188-13.986 6.188z"/></svg>';
                case 4 : return '<svg style="position:relative; top:30px; left:7px;" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="75" height="75" viewBox="0 0 374 374"><image overflow="visible" width="83" height="83" xlink:href="data:image/png;base64,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 IxYX9r8AAwDd+QlIuNqI2wAAAABJRU5ErkJggg==" transform="scale(4.5)"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#F0EFEF" d="M243 279l-13.5-36-72-67.5 49.5 72-36 18 36 58.5 36-4.5-13.5-31.5z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#11B5BB"  class="iconStepFinalColor1" d="M292.496 153c-.748-7.501-4.496-9-4.496-9l-121.5-13.5 4.5 13.5 4.5 9 112.5 9s5.252-1.503 4.496-9z"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#F7EC21" d="M315 247.5l-85.5 36 18 40.5 81-40.5z" class="iconStepFinalColor2"/><path fill-rule="evenodd" clip-rule="evenodd" fill="#333" d="M315.835 246.248l-15.71 5.972c-2.237-3.243-6.579-15.152-14.683-30.867l-5.704-56.026 6.684.813.748-.272c.76-.277 7.475-2.878 9.035-9.211 1.067-4.311-.585-8.925-4.896-13.707l-.861-.954-1.273-.136c-4.232-.439-8.434-.888-12.591-1.336v-103.834l-.088.053c-.22-12.305-9.791-22.254-21.841-23.08v-.163h-208.983v.009c-12.898.053-23.374 10.635-23.374 23.651 0 10.956 7.462 20.114 17.508 22.79v264.036h208.851l-16.076-37.811 79.797-30.586 14.379 32.994 6.1-2.799-17.022-39.536zm-28.675-97.801c1.6 1.964 3.055 4.447 2.545 6.557-.496 2.057-2.777 3.551-4.152 4.219l-110.313-13.412-.083.699-3.468-11.887c15.29 2.056 62.926 8.322 115.471 13.824zm-76.56 8.473v5.911l-8.935 7.783-19.688-17.174 28.623 3.48zm-46.438-30.212l2.43-12.718 40.892-14.093 60.983 33.592 1.032 6.262c-22.711-2.5-43.813-5.036-60.86-7.167l-10.48-12.907-18.541 8.38.379.853c-7.827-1.033-12.367-1.657-12.525-1.679l-17.797-2.663h8.072l-.167.866 6.582 1.274zm34.826 4.662c-2.838-.36-5.52-.708-8.033-1.028l5.266-2.382 2.767 3.41zm54.08-111.111c8.912 0 16.158 7.075 16.668 15.939h.07v.729l.026.233-.026.229v16.304l.07-.083v72.804l-16.251-8.921v-59.96h-.022v-3.529l-.535.053c-9.242 0-16.762-7.581-16.762-16.897.001-9.321 7.52-16.901 16.762-16.901zm-224.068 16.901c0-9.026 6.459-16.356 15.297-16.813l.066-.088h192.33c-4.363 4.298-7.092 10.274-7.092 16.901 0 6.57 2.676 12.511 6.979 16.805h-194.396c-7.463-1.714-13.184-8.776-13.184-16.805zm194.264 244.266l15.219 35.803h-191.971v-256.488l.053-.004-.009-.013h200.368v53.09l-38.795-21.283-47.391 16.33-1.705 8.947h-85.701v6.759h75.146l.725 27.04h-33.683v6.763h33.863l.352 13.113 15.637 15.196h-92.04v6.759h98.621v-.364l31.686 30.783h-130.307v6.759h137.263l16.651 16.181 6.112 18.185h-160.026v6.759h162.303l1.485 4.421-13.856 5.264zm20.132-7.647l-10.327-30.709-76.707-74.536-.975-36.277 9.021 1.349 5.26 18.031 31.988 27.909 15.648-13.623v-8.187l55.617 6.759 5.898 58.654.334.658c8.525 16.559 12.845 25.717 15.002 30.679l-50.759 19.293z"/></svg>';
            }
        },
        templateFinal() {
            let t = [], i, d, finalCnt;
            let resumeSubmitOath;

            isFinalOK = false;
            finalCnt = 0;

            t.push(`	<ul class="stepFinalList length${fullData.stepStatusList.length} ${fullData.stepStatusList.length > 2 ? 'circle' : ''}">`);
            for(i=0; i<fullData.stepStatusList.length; i++) {
                d = fullData.stepStatusList[i];
                t.push('	<li class="'+`step${i+1}`+` ${d.completeYn === true ? 'final' : ''}">`);
                t.push(fn.templateFinalSVG(i+1));
                t.push(`        <span class="stepTitle">${stepListTitle[Number(d.STEP)-1]}</span><span class="stepFinalStatus ${d.completeYn ? 'complete' : 'notcomplete'}">${d.completeYn ? '완료' : '미완료'}</span>`);
                t.push('    </li>');
                if(d.completeYn === true) finalCnt++;
            }
            t.push('	</ul>');

            if(finalCnt === fullData.stepStatusList.length) isFinalOK = true; // 최종제출 완료된 수가 스탭 수랑 같으면 최종제출 허용

            if(isFinalOK) { // 최종제출시 타임라인 노출
                t.push('<div id="applicantTimeline">');
                t.push('</div>');
            }

            if(isFinalOK || keyData.resumeSn === 0) { // 지원서 미리보기 시에는 무조건 동의 서약서 노출 되어야함
                $.ajax({
                    type:'post', beforeSend : Common.loading.show(),
                    url : '/app/applicant/getResumeSubmitOath',
                    data : {
                        systemKindCode: 'MRS2',
                        jobnoticeSn : keyData.recruitNoticeSn
                    },
                    async : false
                }).fail(Common.ajaxOnFail).always(Common.loading.hide)
                    .done(function(data) {
                        resumeSubmitOath = data.resumeSubmitOath;
                    });

                t.push('<h2 class="finalH2">최종제출</h2>');
                t.push(`<div data-agreementLetterSn="${resumeSubmitOath.agreementLetterSn}">`);
                t.push(resumeSubmitOath.agreementItemContents);
                t.push('</div>');
                t.push('<label class="checkbox"><input type="checkbox" name="resumeOath" value="true" /><span class="label"> 위 내용을 모두 확인 하였으며, 이에 동의합니다.</span></label>');

                /*t.push('<article class="writtenOath">');
                t.push('	<header><h1>지원자 동의 서약서</h1></header>');
                t.push('	<ol>');
                t.push('		<li>본인은 "'+fullData.recruitNoticeName+'"에 지원함에 있어 인사청탁 등 불명예스러운 일을 하지 않을 것이며, 이를 어길 시 어떠한 불이익도 감수할 것을 서약합니다.</li>');
                t.push('		<li>지원서 상의 모든 기재 사항은 사실과 다름이 없음을 증명하며, 차후 지원서 상의 내용이 허위로 판명되어 합격 또는 입사가 취소되더라도 이의를 제기하지 않을 것을 서약합니다.</li>');
                t.push('	</ol>');
                t.push('	<footer>');
                t.push('		<div><span>제출일</span> <span>'+D.date(fullData.submitDate, 'yyyy년 MM월 dd일')+'</span></div>');
                t.push('		<div><span>지원자</span> <span>'+(fullData.applicantName || '○○○')+'</span></div>');
                t.push('	</footer>');
                t.push('</article>');*/
            }

            return t.join('');
        },
        // 하단 세션 및 저장버튼 템플릿
        loadTemplateFooter(nextStep) {
            let t = [];

            t.push('<div id="sessionArea" class="sessionArea">');
            t.push('	<div class="clock"><div class="point"></div></div>');
            t.push('	<dl>');
            t.push('		<dt class="login">로그인 세션 남은 시간</dt>');
            t.push('		<dd class="login">');
            t.push('			<span id="countTime" class="count">30분 00초</span><span id="countTimeTotal" class="countTotal"> / 30분</span>');
            t.push('			<button type="button" class="btn btn-mini" data-button="keepLogin">연장</button>');
            t.push('			<button type="button" class="btn btn-mini btn-ng" data-tooltip="session">?</button>');
            t.push('			<div id="sessionTooltip" class="sessionTooltip hide"><strong>30분 이내</strong> 저장하지 않으면, 세션이 종료되어 로그인 정보가 사라집니다.<br><strong>30분마다 임시저장</strong>을 해주세요.</div>');
            t.push('		</dd>');
            t.push('		<dt class="regist">접수기간</dt>');
            t.push('		<dd class="regist" id="deadlineTime"></dd>');
            t.push('	</dl>');

            if(!isFinalStep) { // 최종제출이 아닐 경우
                t.push('<div class="btnGroup">');
                if(keyData.isJobfair) { // 박람회일 경우 불러오기 버튼 생성
                    if(keyData.step !== 4) t.push('<button type="button" data-button="modalLoadResume" class="btn btn-great btn-ng">이력서 불러오기</button>');
                    // else t.push('<button type="button" data-button="modalLoadIntroduce" class="btn btn-great btn-ng">자기소개서 보기</button>');
                }
                t.push('<button type="button" data-type="tempSave" class="btn btn-great btn-ng">임시저장</button>');
                t.push(`<button type="submit" data-step="${nextStep}" class="btn btn-great">다음</button>`);
                t.push('</div>');
            } else { // 최종제출일 경우
                if(isFinalOK) t.push('<div class="btnGroup"><button type="submit" class="btn btn-great">최종제출</button></div>');
                else t.push('<div class="btnGroup notFinal">이전 단계가 완료되지 않아 이력서를 최종제출 할 수 없습니다.</div>');
            }
            t.push('</div>');

            return t.join('');
        },
        // 대단위 템플릿 코드에 맞는 항목별 소단위 템플릿 호출
        loadTemplate(d) {
            let t = [], i;
            switch(d.code) {
                case 11 : // 기본정보
                    t.push(WriteResumeTemplate.applicant(d.items)); // 지원자
                    t.push(WriteResumeTemplate.recruitField(d.items['104'])); // 지원분야
                    t.push(WriteResumeTemplate.pay(d.items)); // 연봉
                    t.push(WriteResumeTemplate.join(d.items)); // 입사관련
                    t.push(WriteResumeTemplate.interviewArea(d.items['112'])); // 면접가능 지역
                    t.push(WriteResumeTemplate.recommend(d.items['113'])); // 추천인
                    t.push(WriteResumeTemplate.applyChannel(d.items['114'])); // 지원경로
                    t.push(WriteResumeTemplate.additionalCode(d.items['115'])); // 가점코드
                    t.push(WriteResumeTemplate.additionalQuestion(d.items['116'], 'additionalInfo')); // 추가사항
                    break;
                case 13 : // 인적정보
                    t.push(WriteResumeTemplate.photo(d.items['117'])); // 사진
                    t.push(WriteResumeTemplate.country(d.items['118'])); // 국적
                    t.push(WriteResumeTemplate.address(d.items['119'])); // 주소
                    t.push(WriteResumeTemplate.contact(d.items['120'])); // 연락처
                    t.push(WriteResumeTemplate.homepage(d.items['121'])); // 홈페이지
                    t.push(WriteResumeTemplate.religion(d.items['178'])); // 종교
                    t.push(WriteResumeTemplate.speciality(d.items['122'])); // 특기
                    t.push(WriteResumeTemplate.hobby(d.items['123'])); // 취미
                    t.push(WriteResumeTemplate.body(d.items)); // 신체정보
                    t.push(WriteResumeTemplate.smoking(d.items['130'])); // 흡연
                    t.push(WriteResumeTemplate.marriage(d.items['131'])); // 결혼여부
                    t.push(WriteResumeTemplate.family(d.items['132'])); // 가족사항
                    t.push(WriteResumeTemplate.handicap(d.items['133'])); // 장애여부
                    t.push(WriteResumeTemplate.patriot(d.items['134'])); // 보훈여부
                    t.push(WriteResumeTemplate.lowIncome(d.items['135'])); // 저소득층
                    t.push(WriteResumeTemplate.housingType(d.items['136'])); // 주거형태
                    t.push(WriteResumeTemplate.motto(d.items['137'])); // 좌우명
                    t.push(WriteResumeTemplate.military(d.items['138'])); // 병역사항
                    t.push(WriteResumeTemplate.additionalQuestion(d.items['139'], 'personalInfo')); // 추가사항
                    break;
                case 140 : // 고등학교
                    t.push(WriteResumeTemplate.highschool(d));
                    break;
                case 141 : // 대학교
                    t.push(WriteResumeTemplate.college(d, 'college'));
                    break;
                case 142 : // 대학원
                    t.push(WriteResumeTemplate.college(d, 'graduateSchool'));
                    break;
                case 14 : // 학력사항 추가
                    for(i=0; i<d.items.length; i++) {
                        t.push(WriteResumeTemplate[d.items[i].code](d.items[i]));
                    }
                    break;
                case 15 : // 연구실적
                case 16 : // 경력사항
                case 17 : // NCS
                case 18 : // 자격/기타정보
                    // 여기서부터는 순서 정해진대로 루프를 돌면서 코드값으로 함수를 호출
                    for (i = 0; i < d.items.length; i++) {
                        if(d.items[i] && d.items[i].code) {
                            t.push(WriteResumeTemplate[d.items[i].code](d.items[i]));
                        }
                    }
                    break;
                case 176 : // 자기소개서
                    t.push(WriteResumeTemplate.additionalQuestion(d, 'introduction'));
                    break;
                case 177 : // 역량기술서
                    t.push(WriteResumeTemplate.additionalQuestion(d, 'competency'));
                    break;
            }
            return t.join('');
        },
        event() {
            // 스탭별로 이벤트를 분기
            switch(keyData.step) {
                case 1 :
                    // 사진등록
                    $('button[data-button="addPhoto"]').click(function() {
                        $('#wrapPhoto>label').click();
                    });

                    $('select[data-type="recruitField"]').change(fn.changeRecruitField);
                    break;
                case 2 :
                    $(document).on('click', 'button[data-button="addCollege"]', fn.addCollege);
                    $(document).on('click', 'button[data-button="removeCollege"]', fn.removeCollege);
                    break;
                case 3 :
                case 4 :
                    break;
            }

            // 임시저장 및 탭 이동
            $('[data-type="tempSave"]').click(fn.submit);

            // 탭 or 다음버튼으로 저장 후 이동하려고 하면 form의 data-step을 변경w해서 이동함
            $('button[type="submit"]').click(function() {
                $('#frm').attr('data-step', $(this).attr('data-step'));
            });

            // 다음버튼(저장)
            $('#frm').submit(fn.submit);

            // 학교/전공/자격증 등의 검색창에서 엔터
            $(document).on('keypress', 'input[type="search"]', fn.templateSearchBox);

            // input[type="text"], input[type="number"] 의 엔터 막음
            $(document).on('keypress', 'input[type="text"], input[type="number"]', function(e) {
                if(e.keyCode === 13) return false;
            });

            // 우편번호 검색, 학교/자격증 등의 검색창에서 사용하는 sn필드는 키입력 허용을 하지 않는다.
            $(document).on('keypress', 'input[type="text"].hidden', function(e) {
                return false;
            });

            //주소 입력 부분에서 상동 기능
            $(document).on('click', 'button[data-button="copyAddress"]', function(e) {
                let $originAddress = $('div[data-row="address"]').eq(0); //항상 주소 하위 첫번째 항목에서 가져옴
                let $targetAddress = $(this).closest('div[data-row="address"]');

                $targetAddress.find('input[name$=".zipCode"]').val($originAddress.find('input[name$="zipCode"]').val());
                $targetAddress.find('span[data-span="postcode"]').text($originAddress.find('input[name$="zipCode"]').val());
                $targetAddress.find('input[name$=".address"]').val($originAddress.find('input[name$="address"]').val());
                $targetAddress.find('input[name$=".detailAddress"]').val($originAddress.find('input[name$="detailAddress"]').val());
                if($targetAddress.find('[data-button="resetAddressResult"]').length === 0) $('<button type="button" class="resetAddressResult" data-button="resetAddressResult"></button>').insertAfter($targetAddress.find('span[data-span="postcode"]'));
            });

            //주소 입력부분에서 취소 기능
            $(document).on('click', 'button[data-button="resetAddressResult"]', function(e) {
                let $targetAddress = $(this).closest('div[data-row="address"]');

                $targetAddress.find('input[name$=".zipCode"]').val('');
                $targetAddress.find('span[data-span="postcode"]').text('');
                $targetAddress.find('input[name$=".address"]').val('');
                $targetAddress.find('input[name$=".detailAddress"]').val('');
                $targetAddress.find('button[data-button="resetAddressResult"]').remove();

                if ($targetAddress.index('div[data-row="address"]') === 0) {
                    $('button[data-button="copyAddress"]').prop('disabled', true);
                }
            });

            // 검색한 내용을 삭제 텍스트를 눌러 삭제
            $(document).on('click', 'button[data-button="resetSearchResult"]', fn.resetSearchResult);

            // 마우스 다운으로 처리해야할 모든 이벤트를 담은 함수
            $(document).on('mousedown', fn.eventMouseDown);
            $(window).on('scroll', function() {
                $('div[data-dropdown].active').removeClass('active'); //보통 브라우저들과 똑같이 동작하기 위해서 스크롤시 드롭다운 닫음
            });

            // 추가/삭제/리셋
            $(document).on('click', 'button[data-button="add"]', fn.add);
            $(document).on('click', 'button[data-button="remove"]', fn.remove);
            $(document).on('click', 'button[data-button="reset"]', fn.reset);

            // 드랍다운
            $(document).on('click', 'div[data-dropdown]>button', function() {
                let $dropdown = $(this).closest('div[data-dropdown]');
                if($dropdown.hasClass('active')) $dropdown.removeClass('active');
                else $dropdown.addClass('active');

                //  자기소개서 하단에 selectbox 영역이 모두 출력되지 않아 옵션항목이 보이지 않는경우 거꾸로 출력
                $dropdown.removeClass('backward');
                if($dropdown.find('.dropdown-menu').height() + $dropdown.offset().top - $(window).scrollTop() + $dropdown.find('button').height() > window.innerHeight - 83) $dropdown.addClass('backward'); //83은 하단 세션 높이
            });

            // 드랍다운 체크박스 연동
            $(document).on('click', 'div[data-dropdown] input:checkbox', fn.multiDropdown);
            $(document).on('click', 'label.selectedCheckbox input[data-name]:checkbox', function() {
                let name, value;
                name = $(this).attr('data-name');
                value = $(this).attr('value');

                //이거 지금 ncs data-rel-id 연동이 잘 안되는거같아서 바꿨는데 안되면 말씀해주세요 신태림 17-03-27
                //$('input[name="'+name+'"][value="'+value+'"]').prop('checked', false);
                $(`input[name="${name}"][value="${value}"]`).click();
            });

            // 멀티셀렉트 초기화 및 이벤트 바인딩
            $(document).on('change', 'select[data-select="multi"]', fn.multiSelect);
            $(document).on('click', 'div[data-type="multiSelected"] input:checkbox', fn.uncheckedMultiSelect);

            //예, 아니오 질문에 답변시
            $(document).on('click', 'input[type="radio"][name$="existYn"]', function(e) {
                let $wrap = $(this).closest('[data-wrap]');
                let type = $wrap.attr('data-wrap');

                if(type && $(e.target).val() === 'false') {
                    $wrap.find('[data-loop]').remove();
                }else if(type && $(e.target).val() === 'true') {
                    if($wrap.find('[data-loop]').size()<1) $wrap.append(WriteResumeTemplate[type](null));
                }
            });

            $(document).on('click', 'button[data-type="currentAddress"],button[data-type="residentAddress"],button[data-type="parentAddress"],button[data-type="familyAddress"]', fn.modalAddress);

            $(document).on('click', '[data-button="downloadForm"]', fn.downloadFile);

            $(document).on('click', 'button[data-button="removeFile"]', function(e) {
                let $wrap = $(this).closest('div.row.file'),
                    $spanFile = $wrap.closest('.span-file');

                fn.removeFile($wrap, $spanFile);
            });

            $(document).on('change', 'input[type="file"]', fn.uploadFile);

            $(document).on('click', 'button[data-button="removePhoto"]', function() {
                let $wrap = $(this).closest('div.subject.photo');

                $.ajax({
                    type:'post', beforeSend : Common.loading.show(),
                    url : '/mrs2/attachFile/deleteFile',
                    data : {
                        fileUid: $wrap.find('input[name="pictureFile"]').val()
                    }
                }).fail(Common.ajaxOnFail).always(Common.loading.hide);

                $wrap.find('img').removeAttr('src');
                $wrap.find('input[name="pictureFile"]').val('');
                $wrap.removeClass('active');
            });

            // Dates - date picker 초기화
            Dates.DEFINE.DEFAULT_FORMAT.YM='yyyy.MM',
                Dates.DEFINE.DEFAULT_FORMAT.MD='MM.dd',
                Dates.DEFINE.DEFAULT_FORMAT.YMD='yyyy.MM.dd',
                Dates.DEFINE.DEFAULT_FORMAT.YMDT='yyyy.MM.dd HH:mm',
                Dates.DEFINE.DEFAULT_FORMAT.TIME='HH:mm',
                Dates.init({},
                    'birthday', {max: `${new Date().getFullYear()-16}/12/31`},
                    'future', {abbr:'future'},
                    'past', {abbr:'past'},
                    'college', { view: `${new Date().getFullYear()}/03/01`, iart:['-1학기', '0/-6/0', '+1학기', '0/+6/0', '3학기', '1/6/0', '4학기', '2/0/0', '5학기', '2/6/0', '6학기', '3/0/0', '7학기', '3/6/0', '8학기', '4/0/0']},
                    'highschool', { view: `${new Date().getFullYear()}/03/01`, iart:['2년', '1/12/0', '3년', '2/12/0']});

            $(document).on('click', '[data-button="linkFile"]', function(e) { //자기가 첨부한 파일 다운로드
                let formfileUid = $(this).closest('.file').find('.inputFileUid').val();
                e.preventDefault();
                $.fileDownload('/mrs2/attachFile/downloadFile', {
                    httpMethod: 'POST',
                    data: `fileUid=${formfileUid}`,
                    successCallback(url) {
                        Common.loading.hide();
                    },
                    failCallback(responseHtml, url) {
                        Common.loading.hide();
                        Alert(responseHtml);
                    }
                });
            });

            $(document).on('focus', 'textarea', function(e) {
                let _this = this;
                let $limitLength = $(_this).closest('.span').find('.limitLength');
                let maxLength = $(_this).attr('data-maxlength');
                let currentLength;
                e.preventDefault();

                // 키보드를 실시간으로 감시해 현재 글자수를 보여줌
                lengthInterval = setInterval(function() {
                    currentLength = $(_this).val().trim().length;
                    $limitLength.html(`<b>${currentLength}</b>${maxLength ? `/${maxLength}` :''}`);
                }, 300);
            });

            //글자수 세기 중단
            $(document).on('blur', 'textarea', function(e) {
                clearInterval(lengthInterval);
            });

            //지원서 하단 ? 를 누르면 툴팁
            $(document).on('click', 'button[data-tooltip="session"]', function(e) {
                $('#sessionTooltip').toggleClass('hide', !($('#sessionTooltip').hasClass('hide')));
            });

            $(document).on('keydown blur', 'input[data-validType="INTEGER"]', function() {
                let val = $(this).val();
                let revalue = new RegExp('[0-9]{1,5}').exec(val);
                $(this).val(revalue && revalue.length ? parseInt(revalue[0]) : '');
            });

            $(document).on('keydown blur', 'input[data-validType="PHONE"]', function() {
                let val = $(this).val();
                let revalue = val.replace(/[^0-9-]/g, '');
                $(this).val(revalue || '');
            });

            // 이력서 불러오기
            $('button[data-button="modalLoadResume"]').click(fn.modalLoadResume);
        },
        downloadFile(e) { //양식다운로드
            let formfileUid = $(this).attr('data-formFileUid');
            e.preventDefault();
            $.fileDownload('/mrs2/attachFile/downloadFile', {
                httpMethod: 'POST',
                data: `fileUid=${formfileUid}`,
                successCallback(url) {
                    Common.loading.hide();
                },
                failCallback(responseHtml, url) {
                    Common.loading.hide();
                    Alert(responseHtml);
                }
            });
        },
        removeFile($wrap, $spanFile, confirmOff) {
            let remove = function() {
                $.ajax({
                    url : '/mrs2/attachFile/deleteFile',
                    type:'post',
                    data : {
                        fileUid: $wrap.find('input[type="hidden"]').val()
                    },
                    beforeSend : Common.loading.show()
                }).always(Common.loading.hide);

                $spanFile.children('.formFileBtnSet').find('input[type="hidden"]').prop('disabled', true);
                $spanFile.children('.formFileBtnSet').html(WriteResumeTemplate.detachFile($spanFile.attr('data-type'), $spanFile.attr('data-required')));
            };

            confirmOff = confirmOff || false; //기본적으로 confirm 나오게;

            if(confirmOff) {
                Confirm('첨부한 파일을 삭제하시겠습니까?', function() { remove(); });
            } else remove();
        },
        uploadFile(e) {
            let formData, value, url, linkPer=80, btnPer=20, name, $target;
            let type = $(this).attr('data-type');
            let index =$(this).closest('div.subject').find('div.span-file').index($(this).closest('div.span-file'));

            switch(type) {
                case 'portfolioFile' : url = '/mrs2/applicant/resume/uploadPortfolioFile'; break; // 포트폴리오
                case 'transcriptFile' : url ='/mrs2/applicant/resume/uploadTranscriptFile'; break; // 성적증명서
                case 'paperFile' :
                case 'researchPaper' :
                case 'researchIPR' :
                case 'researchWriting' :
                case 'researchInvolve' :
                case 'researchPresent' : { //연구실적
                    url ='/mrs2/applicant/resume/uploadResearchFile';
                    type= $(this).closest('[data-loop]').attr('data-loop'); // name값에 따라서 달라짐
                    break;
                }
                case 'project' : url='/mrs2/applicant/resume/uploadProjectFile'; break;// 프로젝트파일첨부
                case 'paper' : { // 논문
                    url='/mrs2/applicant/resume/uploadPaperFile';
                    btnPer=15;
                    linkPer=85;
                    break;
                }
                case 'researchFile' : url='/mrs2/applicant/resume/uploadResearchFile'; break;// 연구실적 파일첨부
                case 'careerFile' : url ='/mrs2/applicant/resume/uploadCareerFile'; break;// 경력기술서
                case 'photo' : url ='/mrs2/applicant/resume/uploadPictureFile'; break; // 사진
                case 'etcFile' : { //기타 서류
                    url ='/mrs2/applicant/resume/uploadEtcFile';
                    btnPer=30;
                    linkPer=70;
                    break;
                }
            }

            name = 'file';
            formData = new FormData();
            value = $(e.target).prop('files')[0];
            if(value) formData.append(name, value); // 파일첨부 안하면 안넣음
            else return;

            $target =$(e.target);
            $.ajax({
                type: 'POST',
                url: url,
                data: formData,
                cache: false,
                processData: false,
                contentType: false,
                beforeSend : Common.loading.show
            }).always(Common.loading.hide)
                .done(function(result) {
                    let d = {}, $fileWrapper;
                    d.fileUid = result;
                    d.fileName = value.name;
                    d.type = type;
                    d.index = index;
                    d.name = `${type}[${index}]`+'.fileUid';
                    $fileWrapper = $target.closest('.formFileBtnSet');

                    d.resumeAttachSn = $fileWrapper.closest('div.span-file[data-resumeAttachSn]').attr('data-resumeAttachSn'); //careerFile과 etcFile만 해당

                    if(type === 'photo') { //사진은 보여주기 처리
                        $('#wrapPhoto').find('img');
                        $('#wrapPhoto').find('img').attr('src', `/mrs2/attachFile/showFile?fileUid=${result}`);
                        $('[name="pictureFile"]').val(result);
                        $('#wrapPhoto').addClass('active');
                        $('input[type="file"][data-type="photo"]').val('');
                    } else {
                        $fileWrapper.html(WriteResumeTemplate.attachFile(d, linkPer, btnPer));
                    }
                }).fail(function(x, e) {
                if (x.status === 999) {
                    Alert(x.responseText);
                } else {
                    Alert('파일의 총 합은 50MB로 제한되어 있습니다.');
                }
            });
        },
        // 저장
        submit(e) {
            let type, step;

            // 이미 저장이 진행중이면 무시한다
            if(saveLock) return false;

            if(WriteResumeTimer.isLogin() === false) {
                WriteResumeTimer.logoutPop();
                return;
            }
            type = $(this).attr('data-type');
            step = $(this).attr('data-step');

            e.preventDefault();
            $('#timerWarring').remove(); // 말풍선 없앰

            // 글쓰기일때는 저장을 하고 미리보기일때는 넘어다닌다.
            if(mode === 'write') fn.save(type, step);
            else if(mode === 'preview') fn.locationSubmit('/mrs2/applicant/resume/writeResume', step);
        },
        getFormData() { //지원자가 작성한 폼 데이터를 얻는 함수
            let param = [];
            $('#frm [name]').each(function() {
                let name, type, value, lastName;

                name = $(this).attr('name');
                type = $(this).attr('type');
                if(param.length > 0) lastName = param[param.length-1].split('=')[0]; // checkbox와 radio는 이름이 여러번 들어가게 되어서 중복이름 차단

                if(name !== lastName && !$(this).prop('disabled')) { // disabled 된 애들 저장안함
                    switch(type) {
                        case 'radio' :
                            value = $(`input[name="${name}"]:checked`).val();
                            if(typeof value === 'undefined') value = '';
                            break;
                        case 'checkbox' :
                            value = (function() {
                                let v = [];
                                if(!$(`input[name="${name}"]:checked`).size()) return '';

                                $(`input[name="${name}"]:checked`).each(function() {
                                    v.push($(this).val());
                                });
                                return v;
                            })();
                            break;
                        default :
                            value = encodeURIComponent($(this).val()); // jsh1026 특수문자(&) 저장안되는 이슈 처리
                    }
                    if(type !== 'file' && value) param.push(`${name}=${value}`); // file는 실시간 저장이므로 무시, value 없으면 저장안함
                }
            });
            return param;
        },
        // 실제로 저장 후 이동하는 함수
        save(saveType, step) {
            let url, param = [], valid = true, isTempSave = false, agreementLetterSn;

            if(saveType === 'tempSave' && !step) isTempSave = true; // 임시저장인지 확인하는 키코드, 탭메뉴 개선 후 사라져야 함
            if(saveType !== 'tempSave') valid = fn.validate();
            if(!valid) return false;

            url = `/mrs2/applicant/resume/saveStep${keyData.step}`;
            step = step || keyData.step; // step이 안넘어오면 현재 스탭으로 다시 불러옴
            saveLock = true; // 락으로 잠가버림

            if(!isFinalStep) { // 일반 스탭
                param = fn.getFormData();

                param.push(`validateYn=${saveType === 'tempSave' ? 'false' : 'true'}`); // 임시저장인지 정식저장인지

                Confirm(`설정을 ${saveType === 'tempSave' ? '임시' : ''}저장하시겠습니까?`, function() {
                    // 운영팀 요청으로 KT 채용 때 저장버튼 클릭 시 1초 딜레이
                    Common.loading.show();
                    setTimeout(function() {
                        $.ajax({
                            type: 'post', dataType: 'json',
                            url: url,
                            data: param.join('&')
                        }).always(function() {
                            Common.loading.hide();
                            saveLock = false;
                        }).fail(Common.ajaxOnfail)
                            .done(function(x, e) {
                                Alert('저장했습니다.', function() {
                                    if(!isTempSave) fn.locationSubmit('/mrs2/applicant/resume/writeResume', step);
                                });
                            });
                    }, 1000);
                }, function() {
                    saveLock = false;
                });
            } else { // 최종제출
                if(saveType === 'tempSave') { // 탭이동
                    Confirm('선택한 단계로 이동하시겠습니까?', function() {
                        fn.locationSubmit('/mrs2/applicant/resume/writeResume', step);
                    }, function() {
                        saveLock = false;
                    });
                } else { // 하단 최종제출버튼
                    agreementLetterSn = $('[data-agreementLetterSn]').attr('data-agreementLetterSn');
                    if($('[name="resumeOath"]').prop('checked') === false) {
                        Alert('서약서 동의가 필요합니다.', function() {
                            $(window).scrollTop($(document).height() - $(window).height()); // 페이지 하단까지 스크롤
                            $('input[name="resumeOath"]').focus();
                        });
                        saveLock = false;
                        return false;
                    }

                    $.ajax({ //지원자 서약서 동의 저장
                        type: 'post',
                        dataType: 'json',
                        url: '/app/applicant/saveResumeSubmitOath',
                        data: {
                            agreementLetterSn : agreementLetterSn
                        },
                        async : false
                    }).always(function() {
                        Common.loading.hide();
                        saveLock = false;
                    }).fail(Common.ajaxOnfail)
                        .done(function(data, e) {
                            $.ajax({
                                type: 'post',
                                dataType: 'json',
                                url: '/app/applicant/checkCurrentPersonalInfoCollection'
                            }).always(function() {
                                Common.loading.hide();
                                saveLock = false;
                            }).fail(Common.ajaxOnfail)
                                .done(function(data, e) {
                                    let IsNeededToReagree = !(data.successYn);
                                    let modalAgreement, funcSubmit;

                                    funcSubmit = function() {
                                        Confirm((hasAutoScreening ?
                                            '<strong style="color:red">최종제출한 후에는 더 이상 수정 및 삭제가 불가능</strong>하오니 반드시 확인하시고 제출하시기 바랍니다.<br>지원서 삭제를 원할경우 관리자에게 문의주세요.' :
                                            '<strong style="color:red">최종제출한 후에는 더 이상 수정이 불가능</strong><span>하오니 반드시 확인하시고 제출하시기 바랍니다.</span>'), function() {
                                            param = {
                                                recruitNoticeSn: keyData.recruitNoticeSn,
                                                resumeSn: keyData.resumeSn
                                            };

                                            // 운영팀 요청으로 KT 채용 때 저장버튼 클릭 시 1초 딜레이
                                            Common.loading.show();
                                            setTimeout(function() {
                                                $.ajax({
                                                    type: 'post',
                                                    dataType: 'json',
                                                    url: url,
                                                    data: param
                                                }).always(function() {
                                                    Common.loading.hide();
                                                    saveLock = false;
                                                }).fail(Common.ajaxOnfail)
                                                    .done(function(data, e) {
                                                        if (data.successYn) {
                                                            Alert('최종제출을 완료했습니다.', function() {
                                                                fn.locationSubmit('/mrs2/applicant/resume/complete');
                                                            });
                                                        } else {
                                                            fn.modalFinalSaveRejected(data); //successYn 이 false일때 설명해주는 모달
                                                        }
                                                    });
                                            }, 1000);
                                        }, function() {
                                            saveLock = false;
                                        });
                                    };

                                    if(!IsNeededToReagree) { funcSubmit(); } else {
                                        modalAgreement = ModalAgreement(keyData.recruitNoticeSn, 'MRS2', 'RESUME_SUBMIT', function() {
                                            $.ajax({
                                                type: 'post',
                                                dataType: 'json',
                                                beforeSend: Common.loading.show(),
                                                url: '/app/applicant/saveCurrentPersonalInfoCollection',
                                                async: false,
                                                data: {
                                                    jobnoticeSn : keyData.recruitNoticeSn,
                                                    systemKindCode : 'MRS2',
                                                    resumeSn: keyData.resumeSn,
                                                    agreementLetterSn : modalAgreement.agreementLetterSn,
                                                    agreementItemSnSet : modalAgreement.agreementItemSnSet.join(),
                                                    applicantActionCode : 'RESUME_SUBMIT'
                                                }
                                            }).always(Common.loading.countHide).fail(Common.ajaxOnfail)
                                                .done(function(x, e) {
                                                    funcSubmit();
                                                });
                                        });
                                    }
                                });
                        });
                }
            }
        },
        // 자체 밸리데이터
        validate() {
            let isValid = true;
            let i=0, j=0;
            let recruitSectorList = [];
            let sectorRegExp =[];
            let regExp ='';
            let nullString;
            let SectorNumisMoreThan1;

            regExp = /^\d{4}.(0[1-9]|1[0-2])$/;

            $('[data-dates$=":YM"],[data-dates*=":YM "],[data-dates$=":YM"]~[data-dates*=":END"],[data-dates*=":YM "]~[data-dates*=":END"]').not(':disabled').each(function(index) {
                let _this = this;
                if(_this.value && !regExp.test(_this.value)) {
                    Alert('해당 항목을 예시와 같이 입력해주세요. <br>(예 : 2017.01)', function() {
                        $(_this).focus();
                    });
                    isValid = false;
                }
            });

            regExp = /[12][0-9]{3}.[0-9]{2}.[0-9]{2}/;

            $('[data-dates$=":YMD"],[data-dates*=":YMD "],[data-dates$=":YMD"]~[data-dates*=":END"], [data-dates*=":YMD "]~[data-dates*=":END"]').not(':disabled').each(function(index) {
                let _this = this;
                if(_this.value && !regExp.test(_this.value)) {
                    Alert('해당 항목을 예시와 같이 입력해주세요. <br>(예 : 2017.01.01)', function() {
                        $(_this).focus();
                    });
                    isValid = false;
                }
            });

            // 대학교/대학원 필수설정인데 하나도 없다면 에러
            $('div[data-wrap="collegeLoop"]').each(function(index) {
                let msg = $(this).attr('data-type') === 'college' ? '대학교는 필수입력항목입니다.' : '대학원은 필수입력항목입니다.';
                if(D.bool($(this).attr('data-required')) && !$(this).find('>div[data-loop]').size()) {
                    Alert(`${msg} 1개 이상 등록하세요.`);
                    isValid = false;
                }
            });

            $('div[data-wrap="foreignExam"]').each(function() {
                let pointedIndex;
                let $wrap = $(this);
                let tmp ={};
                let languageExamCodeList = [];
                let newLanguageExamCodeList = [];
                let duplicatedLanguageCodeList, duplicatedLanguageAndRegistNumList;

                $(this).find('[name$=".languageExamCode"]').closest('div[data-loop]').get().reduce(function(acc, elem) {
                    tmp = {};
                    tmp['languageExamCode'] = $(elem).find('[name$=".languageExamCode"]').val();
                    tmp['registNumber'] = $(elem).find('[name$=".registNumber"]').val();
                    acc.push(tmp);
                    return acc;
                }, languageExamCodeList);

                //중복된 코드리스트
                duplicatedLanguageCodeList = languageExamCodeList.filter(function(val, i) {
                    let index = languageExamCodeList.map(function(val) { return val['languageExamCode']; }).lastIndexOf(languageExamCodeList[i]['languageExamCode']);
                    if(index === i) newLanguageExamCodeList.push(val); //중복안된 리스트
                    else pointedIndex = i;
                    return (index !== i); //다르면 중복된거
                });

                // 중복된코드 리스트중에서 같은 등록번호를 가지고 있는 항목을 검사
                duplicatedLanguageAndRegistNumList = duplicatedLanguageCodeList.filter(function(val, i) {
                    let arr = newLanguageExamCodeList.filter(function(v) {
                        return (v['languageExamCode'] === val['languageExamCode']);
                    }).map(function(v) {
                        return v['registNumber']; //현재 저장된 항목들의 registNumber 배열
                    }).filter(function(v) {
                        return duplicatedLanguageCodeList[i]['registNumber'] === v; // 중복된 시험의 registNumber와 같은 시험코드를 가진 항목들의 registNumber 비교
                    });
                    return arr.length > 0; //같은게 하나이상일 시 시험도 같고,등록번호도 같다
                });

                if(duplicatedLanguageAndRegistNumList.length > 0) {
                    Alert('동일한 등록번호의 시험이 존재합니다.', function() {
                        $wrap.find(`[data-loop="languageExam"][data-index="${pointedIndex}"]`).find('input[type="search"]').focus();
                    });
                    isValid = false;
                }
            });

            //지원분야 선택
            if($('div[data-recruitSector]').length) {
                recruitSectorList = [];
                sectorRegExp =[];

                SectorNumisMoreThan1 = Boolean($('div[data-recruitSector]').eq(0).find('select[name^="applySector"]').length > 1);

                $('div[data-recruitSector]').each(function(index) {
                    let recruitSector = [];
                    $(this).find('select[name^="applySector"]').each(function() {
                        recruitSector.push($(this).val());
                    });
                    recruitSectorList.push(recruitSector.join(','));
                });

                //정규표현식 만듬 1,3, / 1, ,3 이런 비정상적인 값 (비어있는값) 체크
                for(i=0; i<$('div[data-recruitSector]').eq(0).find('select').length; i++) { //1지망 select몇개인지 세가지고 정규표현식만듬
                    if(i===0) sectorRegExp.push('^\\d+');
                    else sectorRegExp.push('\\d+'); //숫자만
                }
                sectorRegExp = sectorRegExp.join(',');

                nullString = sectorRegExp.replace(/\\d\+/g, '').replace(/\^/, ''); //null일때 ,,인지 ,인지 ,,,인지

                sectorRegExp = new RegExp(sectorRegExp);

                //CASE0 : 1지원분야만 받는 경우, "--------" 구분선을 선택했을때
                if($('div[data-recruitSector]').eq(0).find('select[name^="applySector"]').length === 1) {
                    if(recruitSectorList[0] === nullString) {
                        Alert('지원분야를 선택해주세요', function() {
                            $('select[data-type="recruitField"]').eq(0).focus();
                        });
                        isValid = false;
                    }
                }

                //CASE1 : 같은 지원분야를 선택한 경우
                for(i=0; i<recruitSectorList.length; i++) {
                    for(j=0; j<i; j++) {
                        if(recruitSectorList[i] === recruitSectorList[j] && recruitSectorList[j] !== nullString) {
                            Alert(`${j+1}지망과 ${i+1}지망이 동일합니다.<br>다른 지원분야를 입력해주세요.`, function() {
                                $('select[data-type="recruitField"]').focus();
                            });
                            isValid = false;
                        }
                    }
                }

                //CASE2 : 한 지망에서 한 분야라도 선택 안했을 경우
                for(i=0; i<recruitSectorList.length; i++) {
                    if(!sectorRegExp.test(recruitSectorList[i]) && !(recruitSectorList[i] === nullString)) {
                        Alert(`${i+1}지망의 ${SectorNumisMoreThan1 ? '모든' : ''} 분야를 입력해주세요.`, function() {
                            $('select[data-type="recruitField"]').focus();
                        });
                        isValid = false;
                    }
                }

                //CASE3 : 지망을 건너뛰고 다다음지망, 다다다음지망을 입력했을경우
                recruitSectorList.reduce(function(nullIndex, present, i) {
                    if(sectorRegExp.test(present) && nullIndex>0) {
                        Alert(`${nullIndex+1}지망을 입력하지 않았습니다.<BR>지원분야를 순서에 맞춰 입력해주세요.`, function() {
                            $('select[data-type="recruitField"]').focus();
                        });
                        isValid = false;
                    }
                    if(present === nullString && nullIndex === -1) return i; //-1을 체크하는 이유는 가장 첫번째에 건너뛴 아이를 표시해야해서
                    else if(nullIndex>0) return nullIndex;

                    return -1;
                }, -1);
            }

            $('input[data-limit]').each(function(index) {
                let $this = $(this);
                let limit = $(this).attr('data-limit');
                let type = limit.substring(0, limit.indexOf('('));
                let tmp, reg;
                let labelName = $this.attr('title') || $this.closest('div.span').find('.title').text() || $this.attr('placeholder') || '해당항목';

                if($this.val() === '' || $this.val().length === 0) { return true; } //값이 없으면 건너뛰기
                switch(type) {
                    case 'decimal' :
                        tmp = limit.substring(limit.indexOf('(')+1, limit.indexOf(')')).split(',');
                        if(tmp.length === 1) { // decimal(5) 전부정수인경우
                            reg = `${'^-?(\\d' + '{'}${1},${tmp[0]}}?)$`;

                            if(!new RegExp(reg).test($this.val())) { //정수몇자리, 소수점몇자리
                                Alert(`${labelName+ D.postPosition(labelName, 3)} 정수 최대${tmp[0]}자리까지 입력가능합니다.`, function() {
                                    $this.focus();
                                });
                                isValid = false;
                            }
                        } else if(tmp.length === 2) { //decimal(5,2)인경우 -999.99 ~ 999.99
                            tmp[0] = tmp[0] - tmp[1];
                            reg = `${'^-?(\\d' + '{'}${1},${tmp[0]}}([.]\\d{0,${tmp[1]}}?)?)$`;

                            if(!new RegExp(reg).test($this.val())) { //정수몇자리, 소수점몇자리
                                Alert(`${labelName+ D.postPosition(labelName, 3)} 정수 최대${tmp[0]}자리, 소숫점 아래 최대 ${tmp[1]}자리까지 입력가능합니다.`, function() {
                                    $this.focus();
                                });
                                isValid = false;
                            }
                        }
                        break;
                }
            });

            //추가질문사항 MULTI 일때 최소 선택사항 체크
            $('div[data-dropdown][data-min]').each(function(index) {
                let $checkedItems, dataMin, title, required, isSpecialItems;
                isSpecialItems = $(this).find('input:checkbox:checked').is('[data-textinput="true"],[data-others="true"]'); //특수한 항목이면 최소 체크 필요할 필요가 없다
                $checkedItems =$(this).find('input:checkbox:checked:not([data-textinput="true"],[data-others="true"])');
                dataMin =$(this).attr('data-min');
                required = $(this).attr('data-required');

                if(isSpecialItems === false && (($checkedItems.length && $checkedItems.length < dataMin) || (D.bool(required) === true && dataMin && (!$checkedItems || $checkedItems.length === 0)))) {
                    title = $(this).closest('.row').find('.title').text();
                    Alert(`${title}질문에 최소 ${dataMin}개를 선택해야합니다.`);
                    isValid = false;
                }
            });

            // 추가질문사항 최대, 최소 글자 (브라우저마다 구현체가 달라서 기본 기능 사용하지 않기로했음)
            $('textarea[data-maxlength]').each(function(index) {
                let title = $(this).closest('div.row').find('span.title').text();
                let _this = this, length = $(this).val().length, max = Number($(this).attr('data-maxlength'));

                if(!max) return;

                title = title.length > 32 ? `${title.substr(0, 32)}...`: title;
                if (length > max) {
                    Alert(`${title}문항은 최대 ${D.comma(max)}자까지 입력하실 수 있습니다.`, function() {
                        $(_this).focus();
                    });
                    isValid = false;
                }
            });

            $('textarea[data-minlength]').each(function(index) {
                let title = $(this).closest('div.row').find('span.title').text();
                let _this = this, length = $(this).val().trim().length, min = Number($(this).attr('data-minlength'));

                if(!min) return;

                title = title.length > 32 ? `${title.substr(0, 32)}...`: title;
                if (length > 0 && length < min) {
                    Alert(`${title}문항은 최소 ${D.comma(min)}자 이상 입력하세요`, function() {
                        $(_this).focus();
                    });
                    isValid = false;
                }
            });

            $('input[name$=".score"], input[name$=".majorAverageScore"]').each(function() {
                let _this = this;
                let $perfectScoreElement = $(this).closest('div.span').find('input[name$=".perfectScore"],select[name$=".perfectScore"],input[name$=".majorPerfectScore"], select[name$=".majorPerfectScore"]');
                let msg ='';

                msg = `${($(this).attr('title') || '점수') + D.postPosition(($(this).attr('title') || '점수'), 3)} ${$perfectScoreElement.attr('title') || '만점기준'}보다 작아야합니다.`;
                if($perfectScoreElement && $perfectScoreElement.val()) {
                    if (Number($(_this).val()) > Number($perfectScoreElement.val())) {
                        Alert(msg, function() {
                            $(_this).focus();
                        });
                        isValid = false;
                    }
                }
            });

            $('div[data-wrap="major"]').each(function() {
                let isSelected = false, hasMajor = true, isSatisfied = false;
                let $dataWrap = $(this);

                //전공 목록 중 주전공이 없을 경우
                $dataWrap.find('div[data-loop="collegeMajor"]').each(function() {
                    isSelected = $(this).find('input[name$="majorName"]').val();
                    hasMajor = $(this).find('input[name$="majorTypeCode"]:checked').val() === '01';
                    if(isSelected) {
                        isSatisfied = !hasMajor;
                        if(!isSatisfied) return false; //break; 만약에 부전공이 없다해도 다음번째 전공에 부전공을 택했을 수도 있으므로 break하지 않음
                    }
                });

                if(isSatisfied) {
                    isValid = false;
                    Alert('주전공이 입력되지 않았습니다.', function() {
                        $dataWrap.find('input[name$="majorTypeCode"]').focus();
                    });
                }
            });

            $('div[data-wrap="collegeLoop"]').each(function() {
                let isSelected = false,
                    isEnteredCollege = true,
                    hasEnteredCollege = false;

                let CollegeTransferDate = null;//편입일
                let CollegeEnterDate = null;//입학일
                let tmpDate = '';

                let $dataWrap = $(this);

                let getEarlyDate = function(date, standardDate) {
                    return standardDate ? (date < standardDate ? date : standardDate) : date;
                };

                //전공 목록 중 입학이 없을 경우
                $dataWrap.find('div[data-loop="college"], div[data-loop="graduateSchool"]').each(function() {
                    isSelected = $(this).find('input[name$="degreeTypeCode"]').val();
                    isEnteredCollege = $(this).find('input[name$="entranceTypeCode"]:checked').val() === '01';
                    tmpDate = $(this).find('input[name$="entranceDate"]').val();
                    if(isSelected) {
                        if(!isEnteredCollege) CollegeTransferDate = getEarlyDate(tmpDate, CollegeTransferDate);
                        else {
                            hasEnteredCollege = true;
                            CollegeEnterDate = getEarlyDate(tmpDate, CollegeEnterDate);
                        }
                    }
                });

                if(($dataWrap.find('input[name$="entranceTypeCode"]:checked').length > 0) && !hasEnteredCollege) {
                    isValid = false;
                    Alert('입학구분이 편입의 경우 입학한 학교를 필수로 입력해야 합니다.', function() {
                        let top1 = $dataWrap.find('input[name$="entranceTypeCode"]:checked').offset().top;
                        let top2 = $dataWrap.closest('section[data-code]').find('button[data-button="addCollege"]').offset().top;
                        $(window).scrollTop($(window).scrollTop() + top2 - top1);
                        $dataWrap.closest('section[data-code]').find('button[data-button="addCollege"]').focus();
                    });
                }

                if(CollegeTransferDate && CollegeEnterDate && (CollegeTransferDate < CollegeEnterDate)) {
                    isValid = false;
                    Alert('편입 학교의 입학일이 입학 학교의 입학일보다 늦어야 합니다.', function() {
                        $dataWrap.find('input[name$="entranceDate"]').focus();
                    });
                }
            });
            return isValid;
        },
        locationSubmit(url, step) {
            let t = [];

            t.push(`<form id="locationFrm" method="post" action="${url}">`);
            t.push(`	<input type="hidden" name="resumeSn" value="${keyData.resumeSn}" />`);
            t.push(`	<input type="hidden" name="recruitNoticeSn" value="${keyData.recruitNoticeSn}" />`);
            if(step) t.push(`	<input type="hidden" name="step" value="${step}" />`);
            t.push('</form>');

            $('body').append(t.join(''));
            $('#locationFrm').submit();
        },
        // 대학/대학원 추가
        addCollege() {
            let type, $wrap;
            $wrap = $(this).closest('div.collegeBtnSet').prev('[data-wrap]');
            type = $wrap.attr('data-wrap');

            if(isItemLengthMaximized($wrap, $(this))) return;
            $wrap.append(WriteResumeTemplate[type](null, $(this).attr('data-loopName')));
        },
        // 대학/대학원 삭제
        removeCollege() {
            let loopName, $wrap;
            $wrap = $(this).closest('section.writeResume').find('div[data-wrap="collegeLoop"]');
            loopName = $(this).attr('data-loopName');
            $wrap.find(`div[data-loop="${loopName}"]:last-child`).remove();
        },
        //이력서 항목이 추가/삭제 등 변경사항이 있는경우
        update($wrap) {
            //논문, 연구실적은 '대학교및 대학원에서 작성한 학위논문이 있습니까? 라는 div때문에 only-of-type로 버튼 조작이 어려워서 data-numOfRow 라는 어트리뷰트 추가해야되서 그냥 전체에 다추가하기로함

            $wrap.attr('data-numOfRow', $wrap.children('[data-loop]').length);
        },
        // 이력서항목 추가
        add() {
            let type, $wrap, depth1Index, depth1Name;
            $wrap = $(this).closest('[data-wrap]');
            type = $wrap.attr('data-wrap');

            if(isItemLengthMaximized($wrap, $(this))) return;

            // 2뎁스 추가버튼은 1뎁스 내용을 추가로 가져가야한다.
            if(type === 'major' || type === 'grade' || type === 'majorGrade') {
                depth1Name = $(this).closest('div.wrapSubject').attr('data-loop');
                depth1Index = $(this).closest('div.wrapSubject').attr('data-index');
                $wrap.append(WriteResumeTemplate[type](null, depth1Name, depth1Index, null, ''));
            } else $wrap.append(WriteResumeTemplate[type](null));

            fn.update($wrap);
        },
        // 이력서항목 삭제
        remove() {
            let _this = this;
            let loopName, $wrap, $loopWrap, depth, languageExamSn, functionRemove;
            loopName = $(this).closest('div[data-loop]').attr('data-loop');
            $loopWrap = $(this).closest('div[data-loop]');
            $wrap = $(this).closest('[data-wrap]');

            functionRemove = function() {
                $(this).closest(`div[data-loop="${loopName}"]`).remove();

                depth = (loopName === 'collegeMajor' || loopName === 'collegeSemester' || loopName === 'collegeMajorSubject') ? 2 : 1; // 전공, 학기별성적, 과목별성적이면 2뎁스

                $wrap.find(`div[data-loop="${loopName}"]`).each(function(index) {
                    // Index 업데이트
                    $(this).attr('data-index', index);

                    // Name 업데이트
                    $(this).find(`[name*=${loopName}]`).each(function() {
                        let name = D.updateInputName($(this).attr('name'), index, depth);
                        $(this).attr('name', name); // 업데이트 된 name을 적용
                    });

                    // data-rel-id 업데이트
                    $(this).find(`[data-rel-id*=${loopName}]`).each(function() {
                        let name = D.updateInputName($(this).attr('data-rel-id'), index, depth);
                        $(this).attr('data-rel-id', name);
                    });

                    // data-rel-target 업데이트
                    $(this).find(`[data-rel-target*=${loopName}]`).each(function() {
                        let name = D.updateInputName($(this).attr('data-rel-target'), index, depth);
                        $(this).attr('data-rel-target', name);
                    });

                    // data-dates 업데이트
                    $(this).find(`[data-dates*=${loopName}]`).each(function() {
                        let name = D.updateInputName($(this).attr('data-dates'), index, depth);
                        $(this).attr('data-dates', name);
                    });
                });
            };

            if(loopName === 'languageExam' && $loopWrap.find('.ybmValidateDone:not(.hide)').length > 0) { //공인외국어 인증시험일경우 reset 시 인증완료삭제
                languageExamSn = $loopWrap.find('input[name$=".languageExamSn"]').val();

                fn.resetValidatedForeignExam(languageExamSn, function() {
                    $loopWrap.find('.ybmValidateDone').addClass('hide');
                    fn.resetUI.call(_this);
                    functionRemove.call(_this);
                });
            } else {
                functionRemove.call(_this);
            }

            fn.update($wrap);
        },
        // 이력서항목 리셋(삭제 불가능한 첫번째 항목만)
        reset() {
            let _this = this;
            let $wrap, name, languageExamSn, functionReset;
            $wrap = $(this).closest('div[data-loop]');
            name = $wrap.attr('data-loop');
            functionReset = function() {
                // 대학교 내 2뎁스 초기화일 경우에는 1뎁스 이름으로 바꿔줘야함
                if(name === 'collegeMajor' || name === 'collegeSemester' || name === 'collegeMajorSubject') {
                    name = $(this).closest('div[data-wrap]').closest('div[data-loop]').attr('data-loop');
                }

                // 검색 초기화
                $wrap.find('.searchResultName').each(function() {
                    $(this).text('');
                    $(this).val('');
                });

                // 일반 input 초기화
                $wrap.find(`[name^="${name}"], [data-name^="${name}"]`).each(function() {
                    let type = $(this).attr('type'), $this;

                    switch(type) {
                        case 'radio' :
                        case 'checkbox' :
                            if($(this).val()) $(this).prop('checked', false);
                            else $(this).click(); // 값이 없는 공갈 라디오를 클릭해서 linkedForm을 비활성화
                            break;
                        case 'hidden' :
                            if($(this).hasClass('inputFileUid')) { //파일인 경우
                                fn.removeFile($(this).closest('div.file').find('button[data-button="removeFile"]').closest('div.row.file'),
                                    $(this).closest('div.file').find('button[data-button="removeFile"]').closest('div.row.file').closest('.span-file'), true);
                            } else $(this).val('');
                            break;
                        default :
                            $(this).val('');
                    }

                    if($(this).attr('data-rel-id')) {
                        $(this).focus().blur().change().get(0).focus(); // 별 짓을 다 해서 linkedForm을 동작시키자$(this).focus().blur().change().get(0)
                        $(this).focus().blur().change().get(0).blur();
                    }else if($(this).closest('[data-rel-id]')) {
                        $this =$(this).closest('[data-rel-id]');
                        $this.click(); // 별 짓을 다 해서 linkedForm을 동작시키자$(this).focus().blur().change().get(0)
                    }
                });
            };

            if(name === 'languageExam' && $wrap.find('.ybmValidateDone:not(.hide)').length > 0) { //공인외국어 인증시험일경우 reset 시 인증완료삭제
                languageExamSn = $(this).closest('[data-loop]').find('input[name$=".languageExamSn"]').val();

                fn.resetValidatedForeignExam(languageExamSn, function() {
                    $wrap.find('.ybmValidateDone').addClass('hide');
                    fn.resetUI.call(_this);
                    functionReset.call(_this);
                });
            } else {
                functionReset.call(_this);
            }
        },
        // 멀티선택 드랍다운
        multiDropdown(e) {
            let name, value, checked, isTextInput, isOthers, $wrap, checkMax, $checkedItems;
            name = $(this).attr('name'),
                value = $(this).val(),
                checked = $(this).prop('checked'),
                isTextInput = D.bool($(this).attr('data-textInput')),
                isOthers = D.bool($(this).attr('data-others')),
                $wrap = $(this).closest('div[data-dropdown]');

            //멀티선택 최대 최소 설정
            checkMax = $wrap.attr('data-max');
            $checkedItems = $wrap.find('input:checkbox:checked');

            //최대가 되면 체크안되도록
            if(checkMax && checkMax <= $checkedItems.length) {
                $wrap.find('input:checkbox:not(:checked)[data-textInput="false"][data-others="false"]').prop('disabled', true);
            }else{
                $wrap.find('input:checkbox:not(:checked)').prop('disabled', false);
            }

            // 오른쪽에 선택된 것들 보이게 할지 여부
            $(`input[data-name="${name}"][value="${value}"]`).prop('checked', checked);

            if(!isTextInput && !isOthers && checked) { // 일반 메뉴를 클릭
                $wrap.find('input[data-textInput="true"]:checked').click(); // 기타 해제
                $wrap.find('input[data-others="true"]:checked').click(); // 해당사항없음 해제
            }

            if(isTextInput && checked) { // 기타 클릭
                $wrap.find('input[data-textInput="false"]:checked').click();
            }

            if(isOthers && checked) { // 해당사항없음 클릭
                $wrap.find('input[data-others="false"]:checked').click();
            }
        },
        // 멀티셀렉트
        multiSelect(e) {
            let value = $(this).val();

            if(!value) return false;

            $(this).closest('div.row').find(`div[data-type="multiSelected"] input:checkbox[value="${value}"]`).trigger('click'); //이벤트일으켜 linkedForm동작시킴
            $(this).closest('div.row').find(`div[data-type="multiSelected"] input:checkbox[value="${value}"]`).prop('checked', true);
            $(this).find(`option[value="${value}"]`).prop('disabled', true).hide(); // 현 선택항목 disabled 및 숨김
        },
        // 멀티셀렉트 선택항목 취소
        uncheckedMultiSelect(e) {
            let value = $(this).val();
            $(this).closest('div.row').find(`select[data-select="multi"]>option:disabled[value="${value}"]`).prop('disabled', false).show();
        },
        // 지원분야 동작하는 로직
        changeRecruitField(e) {
            let index, maxLength, i, j, l, title, $select, t = [], value, assoarr, namearr, currentArray, orderedCurrentArray, len;
            value = $(this).val();
            index = Number($(this).attr('data-depth'));

            maxLength = $(this).closest('div.row').find('select').size(); //header갯수

            assoarr = fullData[0].items['104'].recruitSectorAssoArray; //template에서 만든 연관배열을 여기서도 사용할거임
            namearr = fullData[0].items['104'].recruitSectorDetailNames;
            currentArray = assoarr; //여기는 depth에 따라서 점점 범위가 좁혀짐
            for(i=0; i<maxLength; i++) {
                $select = $(this).closest('div.row').find(`select[data-depth="${i}"]`);
                value = $select.val();
                title = fullData[0].items['104'].recruitSectorHeader[i];

                if(i <= index) {
                    currentArray= currentArray[value];
                } else if(currentArray && i === index + 1) {
                    t.push(`<option value="">${title}</option>`);
                    t.push('<option value="">-------------------------</option>');

                    //#6037 KT요청으로 인해 프론트에서 공고에서 등록한 순서대로 임의로 우선순위를 만들어준후, 재배열
                    orderedCurrentArray ={};
                    len = Object.keys(currentArray).length;
                    if ('order' in currentArray) len = len-1; //순서를 뜻하는 order는 길이에 포함시키면안됨

                    for(l=0; l<len; l++) {
                        orderedCurrentArray[currentArray[Object.keys(currentArray)[l]].order] = {};
                        orderedCurrentArray[currentArray[Object.keys(currentArray)[l]].order].code = Object.keys(currentArray)[l]; //companyRecruitCodeSn
                        orderedCurrentArray[currentArray[Object.keys(currentArray)[l]].order].name = namearr[Object.keys(currentArray)[l]]; //분야명칭
                    }

                    for(j in orderedCurrentArray) {
                        t.push(`<option value="${orderedCurrentArray[j].code}">${orderedCurrentArray[j].name}</option>`);
                    }

                    /* 원래소스
                    for(j=0;j<Object.keys(currentArray).length;j++) {
                        t.push('<option value="'+Object.keys(currentArray)[j]+'">'+namearr[Object.keys(currentArray)[j]]+'</option>');
                    }*/
                    $select.html(t.join(''));
                } else $select.html(`<option value="">${title}</option>`);
            }
        },
        // 학교/학과/자격증/외국어시험 검색 템플릿
        templateSearchBox(e) {
            let type, url, keyword, param, _this, $wrap, $result, name, code, objName, objCode;

            if(e.keyCode === 13) {
                e.preventDefault();

                _this = this,
                    type = $(this).attr('data-type'),
                    keyword = $(this).val(),
                    param = {},
                    $wrap = $(_this).closest('div.search'),
                    $result = $wrap.find('div.searchResult');

                // 검색되었다는 클래스를 준다.
                $(_this).closest('div.search').addClass('searched');

                switch(type) {
                    case 'address' :
                        url = '/com/code/retrieveZipCodeList';
                        param.dong = keyword;
                        name = 'address';
                        code = 'zipcode';
                        objName = 'address';
                        objCode = 'zipCode';
                        break;
                    case 'highschool' :
                        url = '/com/code/retrieveHighschoolList';
                        param.highschoolName = keyword;
                        name = 'academyName';
                        code = 'academyCode';
                        objName = 'highschoolName';
                        objCode = 'highschoolCode';
                        break;
                    case 'college' :
                        url = '/com/code/retrieveCollegeList';
                        param.collegeName = keyword;
                        name = 'academyName';
                        code = 'academyCode';
                        objName = 'collegeName';
                        objCode = 'collegeCode';
                        break;
                    case 'major' :
                        url = '/com/code/retrieveCollegeMajorList';
                        param.majorName = keyword;
                        name = objName = 'majorName';
                        code = objCode = 'majorCode';
                        break;
                    case 'foreignExam' :
                        url = '/com/code/retrieveForeignExamList';
                        param.foreignExamName = keyword;
                        name = 'languageExamName';
                        code = 'languageExamCode';
                        objName = 'foreignExamName';
                        objCode = 'foreignExamCode';
                        break;
                    case 'license' :
                        url = '/com/code/retrieveLicenseList';
                        param.licenseName = keyword;
                        name = objName = 'licenseName';
                        code = objCode = 'licenseCode';
                        break;
                }

                $.ajax({
                    type: 'post', dataType: 'json', beforeSend : Common.loading.show(),
                    url: url,
                    data: param,
                    async : false
                }).always(Common.loading.hide).fail(Common.ajaxOnfail)
                    .done(function(x, e) {
                        let i, len, t = [], markName, $registBtn, $registBtnKeyword, elseData;
                        len = x.length;
                        if(!len) { // 검색결과가 없을 때
                            t.push('<div class="noResult">검색결과가 없습니다.</div>');

                            // 외국어시험은 직접입력 없음
                            if(type !== 'foreignExam') t.push(`<button type="button" class="registKeyword"><strong class="ellipsis" title="${keyword}">${keyword}</strong>(으)로 등록하기</button>`);
                            $result.html(t.join(''));

                            $registBtn = $wrap.find('button');
                            $registBtnKeyword = $registBtn.find('strong');

                            // 키보드를 실시간으로 감시해서 등록하기에 있는 키워드를 업데이트 한다
                            searchInterval = setInterval(function() {
                                if($(_this).val()) $registBtnKeyword.html($(_this).val());
                                else $registBtn.remove();
                            }, 100);

                            // 등록하기 키워드를 클릭하면 검색창에 있는 키워드를 등록한다.
                            $registBtn.click(function() {
                                fn.addSearchResult($(this).closest('div.span'), name, code, $(_this).val(), 0);
                                $(document).mousedown();
                                clearInterval(searchInterval);
                            });
                        } else { // 검색결과가 있을 때
                            for(i=0; i<len; i++) {
                                //name 과 code외에 따로 넘겨야할 값들 (data-attribute형식)
                                elseData ='';
                                if(objName ==='address') {
                                    x[i]['address'] = x[i]['sido']+x[i]['gugun']+x[i]['dong']+x[i]['bunji']+x[i]['bldg'];
                                }else if(objName === 'foreignExamName') {
                                    elseData = `data-gradeFlag="${x[i]['gradeFlag']}" `+`data-perfactGrade="${x[i]['perfactGrade']}" data-setupCode="${x[i]['setupCode']}" data-setupValue="${x[i]['setupValue']}" data-gradeFlag="${x[i]['gradeFlag']}" data-scoreFlag="${x[i]['scoreFlag']}" `;
                                }else if(objName ==='licenseName') {
                                    elseData = `data-useScore="${x[i]['useScore']}" `;
                                }

                                markName = x[i][objName].replace(keyword, `<strong>${keyword}</strong>`);
                                t.push(`<li><button type="button" class="ellipsis" data-code="${x[i][objCode]}" title="${x[i][objName]}" ${elseData}>${markName}</button></li>`);
                            }
                            $result.html(`<ul class="searchResultList">${t.join('')}</ul>`);

                            // 리스트를 클릭하면 등록한다.
                            $wrap.off('click').on('click', 'button[data-code]', function() {
                                let $wrap = $(this).closest('div.span');
                                let resetUI = function() {
                                    let nameValue, codeValue, elseValue;
                                    nameValue = $(this).attr('title');
                                    codeValue = $(this).attr('data-code');
                                    elseValue = $(this).get(0).dataset;
                                    fn.addSearchResult($wrap, name, code, nameValue, codeValue, elseValue);

                                    $wrap.closest('div.span').find('.ybmValidateDone').addClass('hide'); //공인외국어시험 인증표시 초기화
                                    clearInterval(searchInterval);
                                }.bind(this);

                                let languageExamSn = $(this).closest('[data-loop]').find('input[name$=".languageExamSn"]').val();

                                //돔기반으로 사고하다보니 유연성이 많이 떨어지는 코드가 나왔다.
                                //공인 외국어 인증 시험인지 && 그리고 인증이 완료된 항목인지를 검사해야하는 다른 코드로 변경이 필요하다.
                                if($(this).closest('[data-loop]').find('.ybmValidateDone').size() > 0 &&
                                    !$(this).closest('[data-loop]').find('.ybmValidateDone').hasClass('hide')) {
                                    fn.resetValidatedForeignExam(languageExamSn, function() {
                                        fn.resetUI.call($wrap);
                                        resetUI();
                                    });
                                } else {
                                    resetUI();
                                }
                            });
                        }
                    });
            }
        },
        addSearchResult($wrap, name, code, nameValue, codeValue, elseValue) {
            let t = [], index, d = {};
            let funcChangeResultUI = function() { // 원래는 항상 실행되는 코드블럭이었지만, 인증이 필요한 항목의 경우(현재 YBM) 인증되지 않으면 이 코드블럭이 실행되면 안되므로 함수로 묶음처리 했다.
                t.push(`<span>${nameValue}</span>`);
                t.push('<button type="button" class="resetSearchResult" data-button="resetSearchResult"></button>');

                $wrap.find('div.search.searched').removeClass('searched');
                $wrap.find(`input[name$="${name}"]`).val(nameValue).next('span.searchResultName').html(t.join(''));
                $wrap.find(`input[name$="${code}"]`).val(codeValue).focus();
            };

            elseValue = elseValue || {};

            switch(name) {
                case 'licenseName' :
                    $wrap.find(`input[name$="${name}"]`).closest('[data-loop]').find('input[name$="score"]').empty();
                    $wrap.find(`input[name$="${name}"]`).closest('[data-loop]').find('input[name$="perfectScore"]').empty();

                    $wrap.find(`input[name$="${name}"]`).closest('[data-loop]').find('input[name$="score"]').prop('disabled', true);
                    $wrap.find(`input[name$="${name}"]`).closest('[data-loop]').find('input[name$="perfectScore"]').prop('disabled', true);

                    $wrap.find(`input[name$="${name}"]`).closest('[data-loop]').find('input[name$="score"]').closest('.span').css('display', 'none').prev('label.title').css('display', 'none');
                    if (D.bool(elseValue['usescore']) === true) {
                        $wrap.find(`input[name$="${name}"]`).closest('[data-loop]').find('input[name$="score"]').closest('.span').css('display', 'block').prev('label.title').css('display', 'block');
                        $wrap.find(`input[name$="${name}"]`).closest('[data-loop]').find('input[name$="score"]').prop('disabled', false);
                        $wrap.find(`input[name$="${name}"]`).closest('[data-loop]').find('input[name$="perfectScore"]').prop('disabled', false);
                    }

                    funcChangeResultUI();
                    break;
                case 'languageExamName' :
                    index = $wrap.closest('div[data-loop]').attr('data-index');
                    if(!index) throw new Error('index를 구하지 못했습니다.');

                    d = {
                        registNumber:'',
                        examDate:'',
                        gradeCode : '',
                        gradeName : '',
                        gradeCodeList : [],
                        score:'',
                        perfectScore:'',
                        languageExamCode : codeValue,
                        languageExamName : nameValue,
                        setupCode : elseValue['setupcode'],
                        setupValue : elseValue['setupvalue'],
                        gradeFlag : D.bool(elseValue['gradeflag']),
                        scoreFlag : D.bool(elseValue['scoreflag'])
                    };

                    if(elseValue['setupcode'] === 'EXAM_CODE') { // setupCode가 EXAM_CODE이면 토익 인증, setupValue는 ybm에서 요구하는 코드
                        $.ajax({ //MRS-1603 이슈로 ybm 인증 사이트에 api연결이 가능한지 미리 요청해본다.
                            url : '/mrs2/applicant/resume/checkYbmResponse',
                            dataType: 'json',
                            async : false,
                            timeout : 60000 //1분내로 응답이 없을 시 취소한다.
                        }).fail(Common.ajaxOnfail).done(function() {
                            fn.ybmValidate(elseValue['setupvalue'], d, index, funcChangeResultUI);
                        });
                    } else {
                        funcChangeResultUI();
                    }

                    $(`#wrapResume div[data-loop="languageExam"][data-index="${index}"] div[data-template="detail"]`).html(WriteResumeTemplate.foreignExamDetail('change', d, index));
                    break;
                default :
                    funcChangeResultUI();
                    break;
            }
        },
        //공인외국어 검색-인증이 필요한 시험은 백엔드에 인증과 동시에 저장되기때문에 초기화 하는 함수가 필요하다.
        resetValidatedForeignExam(languageExamSn, callback) {
            if(!languageExamSn) return;

            Confirm('인증 내용이 삭제됩니다.<br>인증을 삭제하시겠습니까?', function() {
                $.ajax({
                    type: 'post',
                    dataType: 'json',
                    beforeSend: Common.loading.show(),
                    url: '/mrs2/applicant/resume/deleteForeignExam',
                    data: {languageExamSn: languageExamSn}
                }).always(Common.loading.hide).fail(Common.ajaxOnfail)
                    .done(function(x, e) {
                        if(callback) callback();
                    });
            });
        },
        resetUI(e) {
            let $elemName;

            $elemName = $(this).closest('div[data-loop]').find('span.searchResultName');
            $elemName.html(''); // 텍스트 초기화

            $elemName.closest('div.span').find('input[name$="Name"]').val(''); // Name 초기화
            $elemName.closest('div.span').find('input[name$="Code"]').val('').blur(); // Code 초기화 후 blur이벤트로 LinkedForm 적용
            $elemName.closest('div.span').find('input[name$="languageExamSn"]').val(''); // languageExamSn 초기화
            $elemName.closest('div.span').find('.ybmValidateDone').addClass('hide'); //공인외국어시험 인증표시 초기화
        },
        // 고등학교/대학교/자격증 등의 검색을 초기화하는 삭제버튼
        resetSearchResult(e) {
            let languageExamSn = $(this).closest('[data-loop]').find('input[name$=".languageExamSn"]').val();

            //돔기반으로 사고하다보니 유연성이 많이 떨어지는 코드가 나왔다.
            //공인 외국어 인증 시험인지 && 그리고 인증이 완료된 항목인지를 검사해야하는 다른 코드로 변경이 필요하다.
            if($(this).closest('[data-loop]').find('.ybmValidateDone').length > 0 &&
                !$(this).closest('[data-loop]').find('.ybmValidateDone').hasClass('hide')) {
                fn.resetValidatedForeignExam(languageExamSn, fn.resetUI.bind(this));
            } else {
                fn.resetUI.call(this);
            }
        },
        eventMouseDown(e) {
            let type, $target;
            $target = $(e.target);
            type = $target.attr('type');

            // 학교/자격증 등의 검색창 닫기
            if(type !== 'search' && !$target.closest('div.search').size()) {
                $('div.search.searched').removeClass('searched').find('div.searchResult').html('');
            }
            clearInterval(searchInterval);

            // 드랍다운 닫기
            if(!$target.hasClass('dropdown') && !$target.closest('div[data-dropdown]').size()) {
                $('div[data-dropdown].active').removeClass('active');
            }

            if($target.closest('div[data-dropdown]').size()) { //현재가 자기 켜놓은 드롭다운 빼고는 켜지게
                $('div[data-dropdown].active').filter(function() {
                    return $target.closest('div[data-dropdown]').get(0) !== (this);
                }).removeClass('active');
            }

            //툴팁 닫기
            if(!$target.hasClass('sessionTooltip') && !$target.closest('div[data-tooltip]').size()) {
                $('div.sessionTooltip').addClass('hide');
            }
        },
        updateStep1Data() {
            // 기본정보와 인적사항은 순서를 변경하는 방식이 아니라 목록 고정형이라 배열보다는 Object 키호출이 더 편하다.
            // 그렇기 때문에 본 함수에서 데이터를 배열에서 Object형태로 재가공한다.
            let d1, d2, d3, dataBasic, dataPersonal = {}, i, len;

            d1 = fullData[0];
            dataBasic = {};
            if(d1) {
                for (i = 0, len = d1.items.length; i < len; i++) dataBasic[d1.items[i].code] = d1.items[i];
            }

            d2 = fullData[1];
            if(d2) {
                if (d2.items) {
                    for (i = 0, len = d2.items.length; i < len; i++) dataBasic[d2.items[i].code] = d2.items[i];
                }
                fullData[0].items = dataBasic; // 기본정보 내용을 array => object로 변경
            }

            d3 = fullData[2];
            if(d3) {
                dataPersonal = {};
                if (d3.items) {
                    for (i = 0, len = d3.items.length; i < len; i++) dataPersonal[d3.items[i].code] = d3.items[i];
                }
                fullData[2].items = dataPersonal; // 인적사항 내용을 array => object로 변경
                fullData.splice(1, 1); // 부가정보 날림
            }
        },
        updateStep2Data() {
            let i, d, data = [], arrSplice = [];

            // 구문설명 : 디자인대로 화면을 뿌릴 수 없게 데이터가 오기 때문에 디자인과 동일하게 화면을 뿌리기 위해 데이터를 가공한다.
            // 학력사항에 있는 고등학교/대학교/대학원을 한단계 상승시켜서 맨 앞에 배치하고 학력사항 타이틀은 '학력사항 추가'로 변경
            if(fullData[0].code === 14 && fullData[0].items) { // 학력사항인지 확인
                fullData[0].codeName = '학력사항 추가'; // 학력사항 타이틀 변경
                for(i=0; i<fullData[0].items.length; i++) {
                    d = fullData[0].items[i];
                    // 고등학교/대학원/대학교라면 추가 후 현 데이터는 사용하지 않는다고 표시
                    if(d.code === 140 || d.code === 141 || d.code === 142) {
                        data.push(d);
                        delete fullData[0].items[i];
                        arrSplice.push(i);
                    }
                }

                // 빈 배열을 삭제 - 배열이라 index가 바뀔 수 있어서 역순으로 제거
                for(i=arrSplice.length-1; i>=0; i--) {
                    fullData[0].items.splice(arrSplice[i], 1);
                }

                fullData = data.concat(fullData);
            }
        },
        updateStep3Data() {
            fullData[0].codeName = '자격/기타정보';
        },
        updateStep4Data() {
            let i, d, data = [];
            for(i=0; i<fullData[0].items.length; i++) {
                d = fullData[0].items[i];
                data.push(d);
            }
            fullData = data;
        },
        modalAddress(e) {
            let interval, modalOpt;
            let $parent = $(e.target).closest('.address');
            e.target.blur(); // 버튼에 포커스가 있어서 스페이스 누르면 이벤트가 계속 발생해서 막아버림
            modalOpt = {
                enableConfirm : false,
                title : '우편번호 찾기',
                width : '540',
                height : '350',
                btnTitle : '저장',
                scroll:false,
                openAnimation: false,
                closeAnimation:false,
                btnEvent() {
                    let kind= '';
                    if($('.modal .external').hasClass('hide')) kind ='.internal';
                    else kind = '.external';

                    $parent.find('[name$=".zipCode"]').val($('.modal').find(kind).find('input.postcode').val());
                    $parent.find('span.postCode[data-type]').text($('.modal').find(kind).find('input.postcode').val());
                    $parent.find('[name$=".address"]').val($('.modal').find(kind).find('input.address').val());
                    $parent.find('[name$=".detailAddress"]').val($('.modal').find(kind).find('input.details').val());
                    clearInterval(interval);

                    //내용 삭제 가능한 버튼 추가
                    if($parent.find('[data-button="resetAddressResult"]').length === 0) $('<button type="button" class="resetAddressResult" data-button="resetAddressResult"></button>').insertAfter($parent.find('span.postCode[data-type]'));
                    if ($parent.index('div[data-row]') === 0) $('button[data-button="copyAddress"]').prop('disabled', false);

                    return true;
                },
                callback() {
                    // 주소 3종류가 다 입력되었는지 인터벌을 돌리는 함수
                    let validInterval = function(mode) {
                        clearInterval(interval);
                        interval = setInterval(function() {
                            let isFinish = false;
                            if(!$('#modal').size()) clearInterval(interval);
                            if($(`#modal div.${mode} input.postcode`).val() && $(`#modal div.${mode} input.address`).val() && $(`#modal div.${mode} input.details`).val()) isFinish = true;
                            $('#modal button[data-button="modalSubmit"]').prop('disabled', !isFinish);
                        }, 1000);
                    };

                    validInterval('internal'); // 시작하자마자 국내주소검색이기 때문에 바로 실행한다

                    $('#modal button[data-button="modalSubmit"]').prop('disabled', true);
                    $('#modal [data-button="toExternalAddress"]').on('click', function() {
                        let marginTop = `${($(window).height() - '400px'.replace('px', '').replace('%', '')) / 2}px`;
                        $('.modal').css({ 'height' : '400px', 'marginTop' : marginTop });
                        $('.emptySearchAddress').addClass('hide');
                        $('.inputSearchAddress.external').removeClass('hide');
                        $('#searchAppAdressForm').addClass('hide');
                        $('#modal button[data-button="modalSubmit"]').prop('disabled', true);
                        validInterval('external');
                    });

                    $('#modal [data-button="toInternalAddress"]').on('click', function() {
                        let marginTop = `${($(window).height() - '350px'.replace('px', '').replace('%', '')) / 2}px`;
                        $('.modal').css({ 'height' : '350px', 'marginTop' : marginTop });
                        $('.inputSearchAddress.external').addClass('hide');
                        $('.inputSearchAddress.internal').addClass('hide');
                        $('#searchAppAdressForm').removeClass('hide');
                        $('.emptySearchAddress').removeClass('hide');
                        $('#modal button[data-button="modalSubmit"]').prop('disabled', true);
                        validInterval('internal');
                    });

                    /*$('#searchAppAdressResult').postcodify({ //도로명주소 서버 점검시 임시로 사용할 예정으로 주석 달아놓았음
                        insertAddress : '.modal .internal input.address',
                        insertDetails : '.modal .internal input.details',
                        insertPostcode5 : '.modal .internal input.postcode',
                        controls : '#searchAppAdressForm',
                        beforeSearch: function() {
                            var marginTop = (($(window).height() - '555px'.replace('px', '').replace('%', '')) / 2)+'px';
                            $('.modal').css('height', '555px');
                            $('.modal').css('marginTop', marginTop);
                            $('#searchAppAdressResult').removeClass('hide');
                            $('.emptySearchAddress').addClass('hide');
                            $('.inputSearchAddress.internal').removeClass('hide');
                        }
                    });*/

                    MidasAddress.addressPicker({
                        resultDiv : '#searchAppAdressResult',
                        controls : '#searchAppAdressForm',
                        insertAddress : '.modal .internal input.address',
                        insertDetails : '.modal .internal input.details',
                        insertPostcode5 : '.modal .internal input.postcode',
                        beforeSearch() {
                            let marginTop = `${($(window).height() - '555px'.replace('px', '').replace('%', '')) / 2}px`;
                            $('.modal').css('height', '555px');
                            $('.modal').css('marginTop', marginTop);
                            $('#searchAppAdressResult').removeClass('hide');
                            $('.emptySearchAddress').addClass('hide');
                            $('.inputSearchAddress.internal').removeClass('hide');
                        }
                    });

                    $('#searchAppAdressForm').find('input[type="text"]').attr('placeholder', '예 : 반포대교로 201, 국립중앙도서관, 삼성동 25').focus();
                },
                content : (function() {
                    let t = [];
                    t.push('<div class="row no-margin searchAppAdressForm" id="searchAppAdressForm"></div>');
                    t.push('<div class="row half-margin">');
                    t.push('	<div id="searchAppAdressResult" class="hide"></div>');
                    t.push('	<div class="emptySearchAddress">');
                    t.push('		<dl>');
                    t.push('			<dt>구주소</dt>');
                    t.push('			<dd>동/읍/면/리 + 번지 (예: 삼평동 633)</dd>');
                    t.push('			<dt>신주소</dt>');
                    t.push('			<dd>도로명 + 건물번호 (예: 판교로 228번길 17)</dd>');
                    t.push('		</dl>');
                    t.push('		<hr>');
                    t.push('		<strong>해외거주자의 경우</strong>, 직접 입력을 통해 주소를 입력해주세요');
                    t.push('		<button class="btn btn-mini" style="margin-left:10px;" data-button="toExternalAddress" type="button">직접입력</button>');
                    t.push('	</div>');
                    t.push('</div>');

                    t.push('<div class="inputSearchAddress internal hide" style="margin-bottom:20px;">');
                    t.push('	<div class="row half-margin">');
                    t.push('		<label class="span per15 title">기본주소</label>');
                    t.push('		<div class="span per10">');
                    t.push('			<input type="text" class="text postcode" value="-" maxlength="128" style="border: none; padding:0; margin-left:10px; cursor: default;" readonly>');
                    t.push('		</div>');
                    t.push('		<div class="span per75">');
                    t.push('			<input type="text" class="text address" style="border: none;cursor: default;" readonly>');
                    t.push('		</div>');
                    t.push('	</div>');
                    t.push('	<div class="row half-margin">');
                    t.push('		<label class="span per15 title">상세주소</label>');
                    t.push('		<div class="span per85">');
                    t.push('			<input type="text" class="text details" maxlength="128" placeholder="상세주소를 입력하세요">');
                    t.push('		</div>');
                    t.push('	</div>');
                    t.push('</div>');

                    t.push('<div class="inputSearchAddress external hide" style="margin-bottom:20px;">');
                    t.push('	<h2 class="h2">해외 주소</h2>');

                    t.push('	<div class="row half-margin">');
                    t.push('		<label class="span per15 title">우편번호</label>');
                    t.push('		<div class="span per85">');
                    t.push('			<input type="text" class="text postcode" maxlength="126" placeholder="우편번호를 입력하세요">');
                    t.push('		</div>');
                    t.push('	</div>');

                    t.push('	<div class="row half-margin">');
                    t.push('		<label class="span per15 title">기본주소</label>');
                    t.push('		<div class="span per85">');
                    t.push('			<input type="text" class="text address" maxlength="128" placeholder="기본주소를 입력하세요">');
                    t.push('		</div>');
                    t.push('	</div>');

                    t.push('	<div class="row half-margin">');
                    t.push('		<label class="span per15 title">상세주소</label>');
                    t.push('		<div class="span per85">');
                    t.push('			<input type="text" class="text details" maxlength="128" placeholder="상세주소를 입력하세요">');
                    t.push('		</div>');
                    t.push('	</div>');

                    t.push('	<div class="row half-margin">');
                    t.push('		<div class="span">');
                    t.push('			<button class="btn btn-with-icon" data-button="toInternalAddress" type="button">국내검색으로 돌아가기</button>');
                    t.push('		</div>');
                    t.push('	</div>');
                    t.push('</div>');

                    return t.join('');
                })()
            };
            Common.modal(modalOpt);
        },
        modalLoadResume() {
            let modalOpt;

            $.ajax({
                type: 'post', dataType: 'json', beforeSend : Common.loading.show(),
                url: '/mrs2/applicant/resume/getJobfairOtherResumeList'
            }).always(Common.loading.hide).fail(Common.ajaxOnfail)
                .done(function(x, e) {
                    modalOpt = {
                        enableConfirm : false,
                        title : '이력서 불러오기',
                        width : '540',
                        btnTitle : '이력서 불러오기',
                        confirmMsg : '선택한 이력서를 불러오시겠습니까?',
                        submitDisabled : true,
                        content : (function() {
                            let d, i, t = [];

                            t.push('<p>이력서 불러오기는 자기소개서 스탭을 제외한 모든 스탭에 적용됩니다.<br/>작성한 값은 모두 사라지고, 답변 양식이 같은 항목만 불러옵니다.</p>');
                            t.push(`<h3>내 이력서 보관함 <strong>(${x.length}건)</strong></h3>`);

                            t.push('<ul class="resumeList ellipsis">');
                            for(i=0; i<x.length; i++) {
                                d = x[i];
                                t.push('<li>');
                                t.push(`	<label ${d.submitYn ? '' : 'class="labelNotFinish"'}>`);
                                t.push(`		<div class="wrapRadio"><input type="radio" name="modalResumeSn" value="${d.resumeSn}" /><span class="label"></span></div>`);
                                t.push(`		<div class="jobfairName ellipsis" title="${d.jobfairName}">${d.jobfairName}</div>`);
                                t.push(`		<div class="companyName ellipsis" title="${d.companyName}">${d.companyName}</div>`);
                                if(d.companyLogoUrl) t.push(`<img src="${d.companyLogoUrl}" alt="${d.companyName}" width="105" height="45">`);
                                t.push('	</label>');
                                t.push('</li>');
                            }
                            t.push('</ul>');

                            return t.join('');
                        })(),
                        callback() {
                            // 이력서 목록 클릭하면 이력서 불러오기 버튼 잠금 해제
                            $('#modal input[name="modalResumeSn"]').click(function() {
                                $('#modal button[data-button="modalSubmit"]').prop('disabled', false);
                            });
                        },
                        btnEvent() {
                            let param = {
                                otherResumeSn : $('#modal input[name="modalResumeSn"]:checked').val()
                            };

                            $.ajax({
                                type : 'post', dataType : 'json', beforeSend : Common.loading.show(),
                                url : '/mrs2/applicant/resume/copyFromJobfairOtherResume',
                                data : param,
                                async : false
                            }).always(Common.loading.hide).fail(Common.ajaxOnfail)
                                .done(function(x, e) {
                                    if(x) { // 성공
                                        Alert('선택한 이력서를 불러오기를 성공했습니다. 화면을 새로고침합니다.', function() {
                                            location.reload();
                                        });
                                    } else { // 실패
                                        Alert('이력서 불러오기를 실패했습니다.');
                                    }
                                });

                            return false;
                        }
                    };

                    Common.modal(modalOpt);
                });
        },
        ybmValidate(code, d, index, callback) {
            (function(d, index) {
                $(document).off('ybmReturn').on('ybmReturn', function(e) {
                    d = {
                        errorCode : e.errorCode,
                        errorMessage : e.errorMessage,
                        examDate : e.examDate,
                        registNumber : e.registNumber,
                        score : e.score,
                        perfectScore : e.perfectScore,
                        gradeCode : e.gradeCode,
                        languageExamSn : e.languageExamSn,
                        setupCode : 'EXAM_CODE',
                        certificationYn : true,
                        languageExamCode : e.languageExamCode,
                        gradeFlag : D.bool(e.gradeFlag),
                        scoreFlag : D.bool(e.scoreFlag)
                    };

                    if(d.errorCode !== '200') {
                        Alert(d.errorMessage);
                        return;
                    }

                    $(document).find(`#wrapResume div[data-loop="languageExam"][data-index="${index}"] div[data-template="detail"]`).html(WriteResumeTemplate.foreignExamDetail('change', d, index));

                    //인증마크 표시
                    $(document).find(`#wrapResume div[data-loop="languageExam"][data-index="${index}"]`).find('.ybmValidateDone').removeClass('hide');

                    if(typeof callback === 'function') callback();
                });
            })(d, index);

            window.open('', 'ybmValidateRequest');
            Common.formSubmit('/mrs2/applicant/resume/writeResume/ybmValidateRequest', { examCode : code, etc : d['languageExamCode'] }, 'ybmValidateRequest');
        },
        modalFinalSaveRejected(data) {
            let templateModalNotAllowRegist = function(x) { // 중복지원 불가 안내 템플릿
                let i, d, t = [], headTitle;

                switch(data.dupApplyInspect.dayCount) {
                    case 0 : headTitle = '\'현재 접수 중인 다른 공고에 지원한 이력이 있는 경우\' '; break;
                    case 30 : headTitle = '\'최근 1개월 이내 다른 공고에 지원한 이력이 있는 경우\' '; break;
                    case 90 : headTitle = '\'최근 3개월 이내 다른 공고에 지원한 이력이 있는 경우\' '; break;
                    case 180 : headTitle = '\'최근 6개월 이내 다른 공고에 지원한 이력이 있는 경우\' '; break;
                    case 365 : headTitle = '\'최근 1년 이내 다른 공고에 지원한 이력이 있는 경우\' '; break;
                }


                t.push('<div class="modalDuplicationApply">');
                t.push(`	<p style="margin-bottom:10px;">본 공고는 <b>${headTitle}</b> 지원서 작성이 불가능한 공고입니다.</p>`);
                t.push('	<div class="confirm center">');
                t.push('		<h3 style="margin-bottom:3px;font-size: 20px;margin-top: 0px;font-weight: 400;">중복지원 이력</h3>');
                t.push('		<ul style="font-size:13px">');
                for(i=0; i<x.dupApplyInspect.dupApplyList.length; i++) {
                    d = x.dupApplyInspect.dupApplyList[i];
                    t.push(`		<li>${d.jobnoticeName}(${D.date(d.applyDate, 'yyyy.MM.dd HH:mm:ss')} 지원)</li>`);
                }
                t.push('		</ul>');
                t.push('	</div>');
                t.push('	<p style="margin:10px 0;">해당 공고에 지원한 적이 없음에도 불구하고,위와 같은 메세지가 나오는 경우에는 별도 문의 주시기 바랍니다.</br>감사합니다.</p>');
                t.push('</div>');

                return t.join('');
            };

            Common.modal({
                title : '중복지원 불가 안내',
                width : '700',
                height : '400',
                enabledConfirm : false,
                enabledCancel : false,
                btnTitle : '확인',
                btnEvent() {
                    return true;
                },
                content : templateModalNotAllowRegist(data)
            });
        }
    };

    return {
        init : fn.init,
        fullData() {
            return fullData;
        },
        fullDataObject() {
            return fullDataObject;
        }
    };
})();

$(WriteResume.init);