const FearAndGreedModel = {
    EXTREME_FEAR: 'Extreme Fear',//: 0 and 24; 
    FEAR: 'Fear',// 25-49 score indicates 'fear' in the market. 
    NEUTRAL: 'Neutral',//50 suggests a neutral condition. 
    GREED: 'Greed',//51-74 indicates 'greed' 
    EXTREME_GREED: 'Extreme Greed'//and a score of 75 to 100 means 'Extreme Greed'.
}

export function getScore(value: number): string {

    if(value <=24) {
        return FearAndGreedModel.EXTREME_FEAR;
    }
    else if(value >24 && value < 50) {
        return FearAndGreedModel.FEAR;
    }
    else if(value === 50) {
        return FearAndGreedModel.NEUTRAL;
    }
    else if(value > 50 && value < 75) {
        return FearAndGreedModel.GREED;
    }
    return FearAndGreedModel.EXTREME_GREED;
}