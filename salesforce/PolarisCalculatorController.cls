public with sharing class PolarisCalculatorController {
    
    /**
     * Get opportunity details for calculator initialization
     */
    @AuraEnabled(cacheable=true)
    public static OpportunityData getOpportunityData(String opportunityId) {
        if (String.isBlank(opportunityId)) {
            return null;
        }
        
        try {
            Opportunity opp = [
                SELECT Id, Name, StageName, Amount, AccountId, Account.Name,
                       CloseDate, Type, Description, LeadSource,
                       RecordType.Name, RecordType.DeveloperName
                FROM Opportunity 
                WHERE Id = :opportunityId 
                LIMIT 1
            ];
            
            OpportunityData data = new OpportunityData();
            data.id = opp.Id;
            data.name = opp.Name;
            data.stageName = opp.StageName;
            data.amount = opp.Amount;
            data.accountName = opp.Account?.Name;
            data.closeDate = opp.CloseDate;
            data.recordTypeName = opp.RecordType?.Name;
            data.recordTypeDeveloperName = opp.RecordType?.DeveloperName;
            
            return data;
            
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching opportunity: ' + e.getMessage());
        }
    }
    
    /**
     * Update opportunity stage from calculator
     */
    @AuraEnabled
    public static Boolean updateOpportunityStage(String opportunityId, String stageName) {
        if (String.isBlank(opportunityId) || String.isBlank(stageName)) {
            return false;
        }
        
        try {
            Opportunity opp = new Opportunity(
                Id = opportunityId,
                StageName = stageName
            );
            update opp;
            return true;
            
        } catch (Exception e) {
            throw new AuraHandledException('Error updating opportunity: ' + e.getMessage());
        }
    }
    
    /**
     * Save quote reference to opportunity
     */
    @AuraEnabled
    public static Boolean saveQuoteReference(String opportunityId, String quoteId, String quoteReference) {
        if (String.isBlank(opportunityId)) {
            return false;
        }
        
        try {
            // Update opportunity with quote reference
            // Note: You'll need to create custom fields on Opportunity:
            // - Polaris_Quote_ID__c (Text, 255)
            // - Polaris_Quote_Reference__c (Text, 50)
            
            Opportunity opp = new Opportunity(Id = opportunityId);
            
            // Uncomment after creating custom fields:
            // opp.put('Polaris_Quote_ID__c', quoteId);
            // opp.put('Polaris_Quote_Reference__c', quoteReference);
            
            // update opp;
            
            // For now, just return true
            System.debug('Quote saved: ' + quoteId + ' - ' + quoteReference);
            return true;
            
        } catch (Exception e) {
            throw new AuraHandledException('Error saving quote reference: ' + e.getMessage());
        }
    }
    
    /**
     * Data wrapper class
     */
    public class OpportunityData {
        @AuraEnabled public String id;
        @AuraEnabled public String name;
        @AuraEnabled public String stageName;
        @AuraEnabled public Decimal amount;
        @AuraEnabled public String accountName;
        @AuraEnabled public Date closeDate;
        @AuraEnabled public String recordTypeName;
        @AuraEnabled public String recordTypeDeveloperName;
    }
}
