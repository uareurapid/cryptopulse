import ImageComponent from "./ImageComponent";

export default function Top50TokenListEthereum(props: any) {
   
    //console.log("props",props)
    const list: any = props.tokensList.map( (token: any) =>  {

        const src = `https://ethplorer.io${token.image}`;

        return (
            <div>
                <ImageComponent imageURL={src}/>
                <li key={token.address}>{token.name}</li>
            </div>
        )
        

    });

    
    return (
        <ol>{list}</ol>
    )


    
}