module suistream::content {
    // TODO: Redeploy this package to Sui mainnet and update
    // NEXT_PUBLIC_PACKAGE_ID in .env.local.
    use std::string::String;
    use sui::clock::Clock;
    use sui::coin::{Self, Coin};
    use sui::event;
    use sui::object::{Self, UID};
    use sui::sui::SUI;
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    public struct ContentNFT has key, store {
        id: UID,
        title: String,
        description: String,
        media_blob_id: String,
        metadata_blob_id: String,
        content_hash: String,
        creator: address,
        created_at: u64,
        likes: u64,
        tips: u64,
    }

    public struct ContentMinted has copy, drop {
        object_id: address,
        creator: address,
        created_at: u64,
    }

    public struct ContentLiked has copy, drop {
        object_id: address,
        likes: u64,
    }

    public struct ContentTipped has copy, drop {
        object_id: address,
        creator: address,
        amount: u64,
    }

    public entry fun mint_content(
        title: String,
        description: String,
        media_blob_id: String,
        metadata_blob_id: String,
        content_hash: String,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let creator = tx_context::sender(ctx);
        let id = object::new(ctx);
        let object_id = object::uid_to_address(&id);
        let content = ContentNFT {
            id,
            title,
            description,
            media_blob_id,
            metadata_blob_id,
            content_hash,
            creator,
            created_at: sui::clock::timestamp_ms(clock),
            likes: 0,
            tips: 0,
        };

        event::emit(ContentMinted {
            object_id,
            creator,
            created_at: sui::clock::timestamp_ms(clock),
        });

        transfer::public_transfer(content, creator);
    }

    public entry fun like_content(content: &mut ContentNFT) {
        content.likes = content.likes + 1;
        event::emit(ContentLiked {
            object_id: object::uid_to_address(&content.id),
            likes: content.likes,
        });
    }

    public entry fun tip_creator(content: &mut ContentNFT, tip: Coin<SUI>) {
        let amount = coin::value(&tip);
        content.tips = content.tips + amount;

        event::emit(ContentTipped {
            object_id: object::uid_to_address(&content.id),
            creator: content.creator,
            amount,
        });

        transfer::public_transfer(tip, content.creator);
    }

    public entry fun burn_content(content: ContentNFT, ctx: &mut TxContext) {
        assert!(content.creator == tx_context::sender(ctx), 0);
        let ContentNFT {
            id,
            title: _,
            description: _,
            media_blob_id: _,
            metadata_blob_id: _,
            content_hash: _,
            creator: _,
            created_at: _,
            likes: _,
            tips: _,
        } = content;

        object::delete(id);
    }

    public fun title(content: &ContentNFT): &String {
        &content.title
    }

    public fun creator(content: &ContentNFT): address {
        content.creator
    }

    public fun likes(content: &ContentNFT): u64 {
        content.likes
    }

    public fun tips(content: &ContentNFT): u64 {
        content.tips
    }
}
