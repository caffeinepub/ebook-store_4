import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Stripe "stripe/stripe";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import OutCall "http-outcalls/outcall";

actor {
  include MixinStorage();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type Ebook = {
    id : Text;
    title : Text;
    description : Text;
    priceInCents : Nat;
    pdfBlob : Storage.ExternalBlob;
    coverImageBlob : Storage.ExternalBlob;
  };

  public type Purchase = {
    ebookId : Text;
    buyer : Text;
    sessionId : Text;
  };

  let ebooks = Map.empty<Text, Ebook>();
  let purchases = Map.empty<Text, Purchase>();

  var stripeConfig : ?Stripe.StripeConfiguration = null;

  // Ebook management (admin only)

  public query ({ caller }) func getEbooks() : async [Ebook] {
    ebooks.values().toArray();
  };

  public shared ({ caller }) func addEbook(ebook : Ebook) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add ebooks");
    };
    ebooks.add(ebook.id, ebook);
  };

  public shared ({ caller }) func updateEbook(ebook : Ebook) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update ebooks");
    };
    ebooks.add(ebook.id, ebook);
  };

  public shared ({ caller }) func deleteEbook(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete ebooks");
    };
    ebooks.remove(id);
  };

  // Stripe integration

  public query ({ caller }) func isStripeConfigured() : async Bool {
    stripeConfig != null;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can configure Stripe");
    };
    stripeConfig := ?config;
  };

  func getStripeConfig() : Stripe.StripeConfiguration {
    switch (stripeConfig) {
      case (null) { Runtime.trap("Stripe has not been configured yet") };
      case (?cfg) { cfg };
    };
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(getStripeConfig(), sessionId, transform);
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    await Stripe.createCheckoutSession(getStripeConfig(), caller, items, successUrl, cancelUrl, transform);
  };

  public shared ({ caller }) func completePurchase(sessionId : Text, buyerId : Text, ebookId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can complete purchases");
    };

    let purchase : Purchase = {
      ebookId;
      buyer = buyerId;
      sessionId;
    };
    purchases.add(sessionId, purchase);
  };

  public query ({ caller }) func getPurchasedEbooks(buyerId : Text) : async [Ebook] {
    // Users can only view their own purchases, admins can view any user's purchases
    let callerPrincipalText = caller.toText();
    if (callerPrincipalText != buyerId and not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Can only view your own purchases");
    };

    let buyerPurchases = purchases.values().toArray().filter(
      func(p) { p.buyer == buyerId }
    );

    var purchasedEbooks : [Ebook] = [];
    for (purchase in buyerPurchases.values()) {
      switch (ebooks.get(purchase.ebookId)) {
        case (?ebook) {
          purchasedEbooks := purchasedEbooks.concat([ebook]);
        };
        case (null) {};
      };
    };
    purchasedEbooks;
  };

  public query ({ caller }) func getEbookDownloadUrl(sessionId : Text, ebookId : Text) : async Storage.ExternalBlob {
    // Check if the purchase exists
    switch (purchases.get(sessionId)) {
      case (null) { Runtime.trap("Purchase not found") };
      case (?purchase) {
        if (purchase.ebookId != ebookId) {
          Runtime.trap("Session does not match requested ebook");
        };

        // Verify that the caller is the buyer or an admin
        let callerPrincipalText = caller.toText();
        if (callerPrincipalText != purchase.buyer and not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
          Runtime.trap("Unauthorized: Can only download your own purchases");
        };

        // Return the pdfBlob reference for frontend processing
        let ebook = switch (ebooks.get(ebookId)) {
          case (null) { Runtime.trap("Ebook not found") };
          case (?ebook) { ebook };
        };
        ebook.pdfBlob;
      };
    };
  };
};
